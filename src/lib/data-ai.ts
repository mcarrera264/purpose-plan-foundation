// Purpose Plan — Fase 5. Client-side React Query hooks for AI suggestions.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth-context";
import {
  generateSuggestions,
  cancelBatch,
  acceptSuggestions,
  rejectSuggestion,
} from "@/lib/ai.functions";

export type AiBatchRow = Database["public"]["Tables"]["ai_suggestion_batches"]["Row"];
export type AiSuggestionRow = Database["public"]["Tables"]["ai_suggestions"]["Row"];

export const aiQk = {
  batch: (id: string | null) => ["ai", "batch", id] as const,
  suggestions: (batchId: string | null) => ["ai", "suggestions", batchId] as const,
  activeBatch: (scope: string) => ["ai", "activeBatch", scope] as const,
};

// Latest batch for a given scope (project or task) — used to restore panel state.
export function useLatestBatch(scope: { projectId?: string; taskId?: string; capability: string } | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: aiQk.activeBatch(`${scope?.capability ?? ""}:${scope?.projectId ?? ""}:${scope?.taskId ?? ""}`),
    enabled: !!user && !!scope,
    queryFn: async (): Promise<AiBatchRow | null> => {
      if (!scope) return null;
      let q = supabase.from("ai_suggestion_batches").select("*").eq("capability", scope.capability);
      if (scope.projectId) q = q.eq("project_id", scope.projectId);
      if (scope.taskId) q = q.eq("parent_task_id", scope.taskId);
      const { data } = await q.order("created_at", { ascending: false }).limit(1);
      return (data?.[0] as AiBatchRow | undefined) ?? null;
    },
  });
}

export function useBatch(batchId: string | null) {
  return useQuery({
    queryKey: aiQk.batch(batchId),
    enabled: !!batchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_suggestion_batches").select("*").eq("id", batchId!).single();
      if (error) throw error;
      return data as AiBatchRow;
    },
    refetchInterval: (q) => {
      const s = (q.state.data as AiBatchRow | undefined)?.status;
      return s && ["queued", "preparing", "generating"].includes(s) ? 1500 : false;
    },
  });
}

export function useSuggestions(batchId: string | null) {
  return useQuery({
    queryKey: aiQk.suggestions(batchId),
    enabled: !!batchId,
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_suggestions")
        .select("*").eq("batch_id", batchId!).order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AiSuggestionRow[];
    },
  });
}

export function useGenerateSuggestions() {
  const fn = useServerFn(generateSuggestions);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      capability: "generate_project_tasks" | "decompose_task";
      projectId?: string | null;
      taskId?: string | null;
      extraContext?: string;
      supersedesBatchId?: string | null;
    }) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai"] });
    },
  });
}

export function useCancelBatch() {
  const fn = useServerFn(cancelBatch);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => fn({ data: { batchId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai"] }),
  });
}

export function useAcceptSuggestions() {
  const fn = useServerFn(acceptSuggestions);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      batchId: string;
      items: Array<{
        id: string;
        editedTitle?: string;
        editedDescription?: string | null;
        editedEstimate?: string | null;
      }>;
    }) => fn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useRejectSuggestion() {
  const fn = useServerFn(rejectSuggestion);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai"] }),
  });
}

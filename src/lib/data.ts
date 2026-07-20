// Central data-access layer (React Query) for Purpose Plan Phase 3.
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth-context";

// ---------- Types (aligned to DB enums) ----------
export type ProjectStatus = Database["public"]["Enums"]["project_status"]; // active|completed|archived
export type TaskStatus = Database["public"]["Enums"]["task_status"]; // todo|done|archived
export type TaskOrigin = Database["public"]["Enums"]["task_origin"]; // manual|ai

export type AreaRow = Database["public"]["Tables"]["areas"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
type AreaUpdate = Database["public"]["Tables"]["areas"]["Update"];

// ---------- Query keys ----------
export const qk = {
  areas: (uid?: string) => ["areas", uid] as const,
  projects: (uid?: string) => ["projects", uid] as const,
  project: (uid: string | undefined, id: string) => ["project", uid, id] as const,
  tasks: (uid?: string) => ["tasks", uid] as const,
  projectTasks: (uid: string | undefined, projectId: string) => ["tasks", uid, "project", projectId] as const,
};

// ---------- Areas ----------
export function useAreas(includeArchived = false): UseQueryResult<AreaRow[]> {
  const { user } = useAuth();
  const uid = user?.id;
  return useQuery({
    queryKey: [...qk.areas(uid), includeArchived],
    enabled: !!uid,
    queryFn: async () => {
      let q = supabase.from("areas").select("*").order("position", { ascending: true });
      if (!includeArchived) q = q.eq("is_archived", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AreaRow[];
    },
  });
}

export function useCreateArea() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { name: string; color: string; icon?: string }) => {
      if (!user) throw new Error("No autenticado");
      const name = input.name.trim();
      if (!name) throw new Error("El nombre es obligatorio");
      if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(input.color)) throw new Error("Color inválido");
      const { data, error } = await supabase
        .from("areas")
        .insert({
          user_id: user.id,
          name,
          color: input.color,
          icon: input.icon ?? "sparkles",
          is_system: false,
          position: 100,
        })
        .select()
        .single();
      if (error) throw error;
      return data as AreaRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });
}

export function useUpdateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; color?: string; icon?: string }) => {
      const patch: AreaUpdate = {};
      if (input.name !== undefined) {
        const n = input.name.trim();
        if (!n) throw new Error("El nombre es obligatorio");
        patch.name = n;
      }
      if (input.color !== undefined) {
        if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(input.color)) throw new Error("Color inválido");
        patch.color = input.color;
      }
      if (input.icon !== undefined) patch.icon = input.icon;
      const { data, error } = await supabase.from("areas").update(patch).eq("id", input.id).select().single();
      if (error) throw error;
      return data as AreaRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });
}

export function useArchiveArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase.from("areas").update({ is_archived: archived }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["areas"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export async function countAreaActiveItems(areaId: string) {
  const [projs, tsks] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("area_id", areaId).eq("status", "active"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("area_id", areaId).neq("status", "archived"),
  ]);
  return { projects: projs.count ?? 0, tasks: tsks.count ?? 0 };
}

// ---------- Projects ----------
export function useProjects(opts?: { status?: ProjectStatus | "all"; areaId?: string | null }): UseQueryResult<ProjectRow[]> {
  const { user } = useAuth();
  const uid = user?.id;
  const status = opts?.status ?? "active";
  const areaId = opts?.areaId ?? null;
  return useQuery({
    queryKey: [...qk.projects(uid), status, areaId],
    enabled: !!uid,
    queryFn: async () => {
      let q = supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      if (areaId) q = q.eq("area_id", areaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ProjectRow[];
    },
  });
}

export function useProject(id: string | undefined): UseQueryResult<ProjectRow | null> {
  const { user } = useAuth();
  const uid = user?.id;
  return useQuery({
    queryKey: qk.project(uid, id ?? ""),
    enabled: !!uid && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as ProjectRow | null;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      area_id: string;
      description?: string | null;
      start_date?: string | null;
      target_date?: string | null;
    }) => {
      if (!user) throw new Error("No autenticado");
      const name = input.name.trim();
      if (!name) throw new Error("El nombre es obligatorio");
      if (!input.area_id) throw new Error("Selecciona un área");
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name,
          area_id: input.area_id,
          description: input.description?.trim() || null,
          start_date: input.start_date || null,
          target_date: input.target_date || null,
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      return data as ProjectRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      area_id?: string;
      description?: string | null;
      start_date?: string | null;
      target_date?: string | null;
      status?: ProjectStatus;
    }) => {
      const patch: ProjectUpdate = {};
      if (input.name !== undefined) {
        const n = input.name.trim();
        if (!n) throw new Error("El nombre es obligatorio");
        patch.name = n;
      }
      if (input.area_id !== undefined) patch.area_id = input.area_id;
      if (input.description !== undefined) patch.description = input.description?.trim() || null;
      if (input.start_date !== undefined) patch.start_date = input.start_date || null;
      if (input.target_date !== undefined) patch.target_date = input.target_date || null;
      if (input.status !== undefined) {
        patch.status = input.status;
        if (input.status === "completed") patch.completed_at = new Date().toISOString();
        if (input.status === "archived") patch.archived_at = new Date().toISOString();
        if (input.status === "active") {
          patch.completed_at = null;
          patch.archived_at = null;
        }
      }
      const { data, error } = await supabase.from("projects").update(patch).eq("id", input.id).select().single();
      if (error) throw error;
      return data as ProjectRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ---------- Tasks ----------
export function useTasks(opts?: { includeArchived?: boolean }): UseQueryResult<TaskRow[]> {
  const { user } = useAuth();
  const uid = user?.id;
  const includeArchived = opts?.includeArchived ?? false;
  return useQuery({
    queryKey: [...qk.tasks(uid), includeArchived],
    enabled: !!uid,
    queryFn: async () => {
      let q = supabase.from("tasks").select("*").order("created_at", { ascending: true });
      if (!includeArchived) q = q.neq("status", "archived");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });
}

export function useProjectTasks(projectId: string | undefined) {
  const { user } = useAuth();
  const uid = user?.id;
  return useQuery({
    queryKey: qk.projectTasks(uid, projectId ?? ""),
    enabled: !!uid && !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId!)
        .neq("status", "archived")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      area_id: string;
      project_id?: string | null;
      parent_task_id?: string | null;
      description?: string | null;
      scheduled_date?: string | null;
      scheduled_start?: string | null;
      scheduled_end?: string | null;
    }) => {
      if (!user) throw new Error("No autenticado");
      const title = input.title.trim();
      if (!title) throw new Error("El título es obligatorio");
      if (!input.area_id && !input.parent_task_id) throw new Error("Selecciona un área");
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title,
          area_id: input.area_id || null,
          project_id: input.project_id || null,
          parent_task_id: input.parent_task_id || null,
          description: input.description?.trim() || null,
          scheduled_date: input.scheduled_date || null,
          scheduled_start: input.scheduled_start || null,
          scheduled_end: input.scheduled_end || null,
          status: "todo",
          origin: "manual",
        })
        .select()
        .single();
      if (error) throw error;
      return data as TaskRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TaskUpdate & { id: string }) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase.from("tasks").update(rest).eq("id", id).select().single();
      if (error) throw error;
      return data as TaskRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

/**
 * Reschedule a task with optimistic UI and rollback.
 * Pass null values to clear the schedule.
 */
export function useRescheduleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      scheduled_date: string | null;
      scheduled_start: string | null;
      scheduled_end: string | null;
    }) => {
      if (input.scheduled_start && input.scheduled_end && input.scheduled_end < input.scheduled_start) {
        throw new Error("La hora final no puede ser anterior a la hora inicial");
      }
      if (!input.scheduled_date && (input.scheduled_start || input.scheduled_end)) {
        throw new Error("Una tarea no puede tener hora sin fecha");
      }
      const { error } = await supabase
        .from("tasks")
        .update({
          scheduled_date: input.scheduled_date,
          scheduled_start: input.scheduled_start,
          scheduled_end: input.scheduled_end,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const snapshots = qc.getQueriesData<TaskRow[]>({ queryKey: ["tasks"] });
      qc.setQueriesData<TaskRow[]>({ queryKey: ["tasks"] }, (list) =>
        list
          ? list.map((t) =>
              t.id === input.id
                ? {
                    ...t,
                    scheduled_date: input.scheduled_date,
                    scheduled_start: input.scheduled_start,
                    scheduled_end: input.scheduled_end,
                  }
                : t,
            )
          : list,
      );
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useToggleTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, next }: { id: string; next: TaskStatus }) => {
      const patch: TaskUpdate = { status: next };
      if (next === "done") patch.completed_at = new Date().toISOString();
      if (next === "todo") patch.completed_at = null;
      if (next === "archived") patch.archived_at = new Date().toISOString();
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, next }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const snapshots = qc.getQueriesData<TaskRow[]>({ queryKey: ["tasks"] });
      qc.setQueriesData<TaskRow[]>({ queryKey: ["tasks"] }, (list) =>
        list ? list.map((t) => (t.id === id ? { ...t, status: next } : t)) : list,
      );
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useArchiveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const patch: TaskUpdate = archived
        ? { status: "archived", archived_at: new Date().toISOString() }
        : { status: "todo", archived_at: null };
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

// ---------- Selectors / helpers ----------
export function taskChildren(tasks: TaskRow[], parentId: string) {
  return tasks.filter((t) => t.parent_task_id === parentId);
}
export function taskRoots(tasks: TaskRow[], projectId: string) {
  return tasks.filter((t) => t.project_id === projectId && !t.parent_task_id);
}
export function pendingDescendants(tasks: TaskRow[], id: string): TaskRow[] {
  const out: TaskRow[] = [];
  const walk = (pid: string) => {
    for (const t of tasks) {
      if (t.parent_task_id === pid) {
        if (t.status !== "done" && t.status !== "archived") out.push(t);
        walk(t.id);
      }
    }
  };
  walk(id);
  return out;
}
export function projectProgressPct(tasks: TaskRow[], projectId: string) {
  const inProj = tasks.filter((t) => t.project_id === projectId && t.status !== "archived");
  const leaves = inProj.filter((t) => !inProj.some((c) => c.parent_task_id === t.id));
  if (leaves.length === 0) return 0;
  const done = leaves.filter((l) => l.status === "done").length;
  return Math.round((done / leaves.length) * 100);
}

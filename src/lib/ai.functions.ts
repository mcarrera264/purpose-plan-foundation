// Purpose Plan — Fase 5. Server functions for AI-assisted task suggestion.
// All model calls happen server-side via Lovable AI Gateway.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const PROMPT_VERSION = "pp.v1";
export const SCHEMA_VERSION = "pp.suggest.v1";
export const AI_MODEL = "google/gemini-3-flash-preview";

// Guest / permanent daily quotas (batches per 24h)
const QUOTA_GUEST = 5;
const QUOTA_USER = 40;

function normalizeTitle(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

// ------- generateSuggestions -------
const GenerateInput = z.object({
  capability: z.enum(["generate_project_tasks", "decompose_task"]),
  projectId: z.string().uuid().nullable().optional(),
  taskId: z.string().uuid().nullable().optional(),
  extraContext: z.string().max(2000).optional(),
  supersedesBatchId: z.string().uuid().nullable().optional(),
});

export const generateSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => GenerateInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const isGuest = (claims as { is_anonymous?: boolean })?.is_anonymous === true;
    const quota = isGuest ? QUOTA_GUEST : QUOTA_USER;

    // Rate limit: batches in the last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recent } = await supabase
      .from("ai_suggestion_batches")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if ((recent ?? 0) >= quota) {
      throw new Error(
        `Has alcanzado el límite diario de generaciones (${quota}). Puedes seguir añadiendo tareas manualmente.`,
      );
    }

    // Load context
    let project: {
      id: string; name: string; description: string | null; area_id: string | null;
      target_date: string | null; start_date: string | null; status: string;
    } | null = null;
    let parentTask: {
      id: string; title: string; description: string | null; project_id: string | null;
      area_id: string | null; depth: number;
    } | null = null;
    let areaName: string | null = null;
    let targetDepth = 0;

    if (data.capability === "generate_project_tasks") {
      if (!data.projectId) throw new Error("projectId requerido");
      const { data: p, error } = await supabase
        .from("projects").select("id,name,description,area_id,target_date,start_date,status")
        .eq("id", data.projectId).single();
      if (error || !p) throw new Error("Proyecto no encontrado");
      project = p;
      targetDepth = 0;
    } else {
      if (!data.taskId) throw new Error("taskId requerido");
      const { data: t, error } = await supabase
        .from("tasks").select("id,title,description,project_id,area_id,depth")
        .eq("id", data.taskId).single();
      if (error || !t) throw new Error("Tarea no encontrada");
      if (t.depth >= 2) throw new Error("No se puede desglosar más allá del nivel 2");
      parentTask = t;
      targetDepth = t.depth + 1;
      if (t.project_id) {
        const { data: p } = await supabase
          .from("projects").select("id,name,description,area_id,target_date,start_date,status")
          .eq("id", t.project_id).single();
        project = p ?? null;
      }
    }

    const areaId = parentTask?.area_id ?? project?.area_id ?? null;
    if (areaId) {
      const { data: a } = await supabase.from("areas").select("name").eq("id", areaId).single();
      areaName = a?.name ?? null;
    }

    // Sibling / existing titles (scope: same project + same parent level for dup detection)
    let siblingTitles: string[] = [];
    if (data.capability === "generate_project_tasks" && project) {
      const { data: rows } = await supabase.from("tasks")
        .select("title").eq("project_id", project.id).is("parent_task_id", null)
        .neq("status", "archived");
      siblingTitles = (rows ?? []).map((r) => r.title);
    } else if (parentTask) {
      const { data: rows } = await supabase.from("tasks")
        .select("title").eq("parent_task_id", parentTask.id).neq("status", "archived");
      siblingTitles = (rows ?? []).map((r) => r.title);
    }

    // Create batch (status: generating)
    const started = new Date().toISOString();
    const { data: batchRow, error: batchErr } = await supabase
      .from("ai_suggestion_batches")
      .insert({
        user_id: userId,
        capability: data.capability,
        project_id: project?.id ?? null,
        parent_task_id: parentTask?.id ?? null,
        task_id: parentTask?.id ?? null,
        target_depth: targetDepth,
        extra_context: data.extraContext ?? null,
        supersedes_batch_id: data.supersedesBatchId ?? null,
        model: AI_MODEL,
        prompt_version: PROMPT_VERSION,
        schema_version: SCHEMA_VERSION,
        status: "generating",
        started_at: started,
      })
      .select("*")
      .single();
    if (batchErr || !batchRow) throw new Error(batchErr?.message ?? "No se pudo crear el lote");

    // Build prompt
    const system = [
      "Eres un asistente que ayuda a descomponer objetivos en tareas ejecutables SMART.",
      "Devuelve JSON estricto. No inventes fechas ni horas. Estimaciones en formato humano corto (por ejemplo '30 min', '2 h', '1 d').",
      "Cada tarea debe poder completarse en un rango aproximado de 5 minutos a 3 días.",
      "Si el contexto es claramente insuficiente para proponer tareas útiles, devuelve needs_context=true con una pregunta específica.",
    ].join(" ");

    const ctx: Record<string, unknown> = {
      capability: data.capability,
      target_depth: targetDepth,
      area: areaName,
      language: "es",
      existing_sibling_titles: siblingTitles.slice(0, 40),
      extra_context: data.extraContext ?? null,
    };
    if (project) ctx.project = {
      name: project.name, description: project.description,
      start_date: project.start_date, target_date: project.target_date,
    };
    if (parentTask) ctx.parent_task = {
      title: parentTask.title, description: parentTask.description, depth: parentTask.depth,
    };

    const responseSchema = {
      type: "object",
      properties: {
        needs_context: { type: "boolean" },
        clarification_question: { type: "string" },
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              estimate: { type: "string" },
              smart_rationale: { type: "string" },
            },
            required: ["title"],
          },
        },
      },
      required: ["suggestions"],
    };

    const userMessage =
      "Contexto (JSON):\n" + JSON.stringify(ctx, null, 2) +
      "\n\nDevuelve JSON con la forma:\n" +
      '{"needs_context":false,"suggestions":[{"title":"...","description":"...","estimate":"...","smart_rationale":"..."}]}\n' +
      "Máximo 7 sugerencias, ordenadas por prioridad de ejecución.";

    // Call Lovable AI Gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      await supabase.from("ai_suggestion_batches").update({
        status: "failed", failure_code: "missing_api_key", completed_at: new Date().toISOString(),
      }).eq("id", batchRow.id);
      throw new Error("Servicio de IA no configurado");
    }

    let raw: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "purpose_plan_suggestions", schema: responseSchema, strict: false },
          },
        }),
      });
      clearTimeout(timeout);
      if (!resp.ok) {
        const body = await resp.text();
        let code = "provider_error";
        if (resp.status === 429) code = "rate_limited";
        else if (resp.status === 402) code = "credits_exhausted";
        await supabase.from("ai_suggestion_batches").update({
          status: "failed", failure_code: code, completed_at: new Date().toISOString(),
        }).eq("id", batchRow.id);
        throw new Error(
          code === "rate_limited"
            ? "El servicio de IA está saturado. Inténtalo en unos minutos."
            : code === "credits_exhausted"
            ? "Se han agotado los créditos de IA del espacio de trabajo."
            : `Error del proveedor de IA (${resp.status}): ${body.slice(0, 200)}`,
        );
      }
      const json = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
      raw = json.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      const err = e as Error;
      if (err.name === "AbortError") {
        await supabase.from("ai_suggestion_batches").update({
          status: "failed", failure_code: "timeout", completed_at: new Date().toISOString(),
        }).eq("id", batchRow.id);
        throw new Error("La generación tardó demasiado. Inténtalo de nuevo.");
      }
      throw err;
    }

    let parsed: {
      needs_context?: boolean;
      clarification_question?: string;
      suggestions?: Array<{ title?: string; description?: string; estimate?: string; smart_rationale?: string }>;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      await supabase.from("ai_suggestion_batches").update({
        status: "failed", failure_code: "parse_error", completed_at: new Date().toISOString(),
      }).eq("id", batchRow.id);
      throw new Error("Respuesta no válida del modelo. Reintenta.");
    }

    // needs_context branch
    if (parsed.needs_context) {
      await supabase.from("ai_suggestion_batches").update({
        status: "needs_context",
        notice: parsed.clarification_question ?? "Necesito más contexto para proponer tareas útiles.",
        completed_at: new Date().toISOString(),
      }).eq("id", batchRow.id);
      return { batchId: batchRow.id, needsContext: true, question: parsed.clarification_question ?? null };
    }

    const items = (parsed.suggestions ?? []).slice(0, 7).filter((s) => s && s.title && s.title.trim().length > 0);
    if (items.length === 0) {
      await supabase.from("ai_suggestion_batches").update({
        status: "needs_context",
        notice: "No pude proponer tareas concretas. Añade más contexto.",
        completed_at: new Date().toISOString(),
      }).eq("id", batchRow.id);
      return { batchId: batchRow.id, needsContext: true, question: "Añade más detalle sobre el objetivo o el punto de partida." };
    }

    // Duplicate detection
    const siblingSet = new Set(siblingTitles.map(normalizeTitle));
    const rows = items.map((s, idx) => {
      const title = s.title!.trim();
      const isDup = siblingSet.has(normalizeTitle(title));
      return {
        batch_id: batchRow.id,
        title,
        description: s.description?.trim() || null,
        estimate: s.estimate?.trim() || null,
        smart_rationale: s.smart_rationale?.trim() || null,
        original_title: title,
        original_description: s.description?.trim() || null,
        suggested_depth: targetDepth,
        position: idx,
        is_duplicate: isDup,
        status: "proposed",
      };
    });

    const { error: insErr } = await supabase.from("ai_suggestions").insert(rows);
    if (insErr) {
      await supabase.from("ai_suggestion_batches").update({
        status: "failed", failure_code: "insert_error", completed_at: new Date().toISOString(),
      }).eq("id", batchRow.id);
      throw new Error(insErr.message);
    }
    await supabase.from("ai_suggestion_batches").update({
      status: "completed", completed_at: new Date().toISOString(),
    }).eq("id", batchRow.id);

    return { batchId: batchRow.id, needsContext: false, count: rows.length };
  });

// ------- cancelBatch -------
export const cancelBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ batchId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("ai_suggestion_batches")
      .update({ status: "cancelled", completed_at: new Date().toISOString() })
      .eq("id", data.batchId).eq("user_id", userId)
      .in("status", ["queued", "preparing", "generating"]);
    return { ok: true };
  });

// ------- acceptSuggestions -------
const AcceptInput = z.object({
  batchId: z.string().uuid(),
  items: z.array(z.object({
    id: z.string().uuid(),
    editedTitle: z.string().max(200).optional(),
    editedDescription: z.string().max(2000).nullable().optional(),
    editedEstimate: z.string().max(50).nullable().optional(),
  })).min(1).max(20),
});

export const acceptSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => AcceptInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify batch ownership up front (RLS also enforces).
    const { data: batch, error: bErr } = await supabase
      .from("ai_suggestion_batches").select("id,user_id").eq("id", data.batchId).single();
    if (bErr || !batch) throw new Error("Lote no encontrado");
    if (batch.user_id !== userId) throw new Error("No autorizado");

    type ItemResult = { id: string; ok: boolean; taskId?: string; alreadyAccepted?: boolean; error?: string };
    const results: ItemResult[] = [];

    // Each item is delegated to an atomic SECURITY DEFINER RPC that:
    // - row-locks the suggestion (FOR UPDATE),
    // - short-circuits if already accepted (returns existing task),
    // - re-checks duplicates against live sibling titles,
    // - inserts task + updates suggestion in a single transaction.
    // Safe against double-click, multi-tab, retries, and concurrent requests.
    for (const item of data.items) {
      // Call RPC untyped: fresh signature not in generated types until next codegen.
      const client = supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
      };
      const { data: rpcData, error } = await client.rpc("accept_ai_suggestion", {
        _suggestion_id: item.id,
        _edited_title: item.editedTitle ?? null,
        _edited_description: item.editedDescription ?? null,
        _edited_estimate: item.editedEstimate ?? null,
      });
      if (error) {
        const msg = error.message ?? "";
        let code = "insert_failed";
        if (/rejected/i.test(msg)) code = "rejected";
        else if (/empty title/i.test(msg)) code = "empty_title";
        else if (/max depth/i.test(msg)) code = "max_depth";
        else if (/forbidden|not authenticated/i.test(msg)) code = "forbidden";
        else if (/not found/i.test(msg)) code = "not_found";
        results.push({ id: item.id, ok: false, error: code });
        continue;
      }
      const row = Array.isArray(rpcData) ? (rpcData[0] as { task_id: string | null; already_accepted: boolean; duplicate: boolean } | undefined) : undefined;
      if (!row) { results.push({ id: item.id, ok: false, error: "no_result" }); continue; }
      if (row.duplicate) { results.push({ id: item.id, ok: false, error: "duplicate" }); continue; }
      if (row.task_id) {
        results.push({ id: item.id, ok: true, taskId: row.task_id, alreadyAccepted: row.already_accepted });
        continue;
      }
      results.push({ id: item.id, ok: false, error: "unknown" });
    }

    return { results };
  });

// ------- rejectSuggestion (server, minimal) -------
export const rejectSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await supabase.from("ai_suggestions")
      .update({ status: "rejected", rejected_at: new Date().toISOString() })
      .eq("id", data.id).eq("status", "proposed");
    return { ok: true };
  });

// ------- deleteMyAccountData (Fase 6 §16) -------
// Wipes all app-level data for the current user. Auth identity is not
// removed here; client signs out after a successful call.
export const deleteMyAccountData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const client = supabase as unknown as {
      rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    const { error } = await client.rpc("delete_my_account_data", {});
    if (error) throw new Error(error.message);
    return { ok: true };
  });

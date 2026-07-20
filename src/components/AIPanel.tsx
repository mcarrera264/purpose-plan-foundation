// Purpose Plan — Fase 5. AI Panel (side sheet) for suggestion review.
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sparkles, Loader2, X, Check, RefreshCw, Pencil, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useBatch,
  useLatestBatch,
  useSuggestions,
  useGenerateSuggestions,
  useCancelBatch,
  useAcceptSuggestions,
  useRejectSuggestion,
  type AiSuggestionRow,
} from "@/lib/data-ai";

type Scope =
  | { kind: "project"; projectId: string; projectName?: string }
  | { kind: "task"; taskId: string; taskTitle?: string };

export function AIPanel({
  open,
  onOpenChange,
  scope,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scope: Scope | null;
}) {
  const capability = scope?.kind === "project" ? "generate_project_tasks" : "decompose_task";
  const latestKey = scope
    ? { capability, projectId: scope.kind === "project" ? scope.projectId : undefined, taskId: scope.kind === "task" ? scope.taskId : undefined }
    : null;

  const { data: latest } = useLatestBatch(open && scope ? latestKey : null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  // Adopt the latest batch when the panel opens
  useEffect(() => {
    if (!open) { setActiveBatchId(null); return; }
    if (latest && (latest.status === "generating" || latest.status === "preparing" || latest.status === "completed" || latest.status === "needs_context")) {
      setActiveBatchId(latest.id);
    }
  }, [open, latest]);

  const { data: batch } = useBatch(activeBatchId);
  const { data: suggestions = [] } = useSuggestions(activeBatchId);
  const generate = useGenerateSuggestions();
  const cancel = useCancelBatch();

  const [extraContext, setExtraContext] = useState("");

  const status = batch?.status ?? "idle";
  const isLoading = status === "generating" || status === "preparing" || status === "queued" || generate.isPending;

  const runGenerate = async (supersedesBatchId?: string, contextOverride?: string) => {
    if (!scope) return;
    try {
      const res = await generate.mutateAsync({
        capability,
        projectId: scope.kind === "project" ? scope.projectId : null,
        taskId: scope.kind === "task" ? scope.taskId : null,
        extraContext: contextOverride ?? extraContext ?? undefined,
        supersedesBatchId: supersedesBatchId ?? null,
      });
      setActiveBatchId(res.batchId);
      if (res.needsContext) toast.info("La IA necesita más contexto.");
      else toast.success(`Se generaron ${res.count ?? 0} sugerencias.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const title = scope?.kind === "project"
    ? "Generar tareas con IA"
    : "Desglosar tarea con IA";
  const subject = scope?.kind === "project" ? scope.projectName : scope?.taskTitle;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto border-l-[1.5px] border-ink bg-surface">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-ink">
            <Sparkles className="h-5 w-5" /> {title}
          </SheetTitle>
          <SheetDescription className="text-ink/70">
            {subject ? `Sobre: ${subject}` : "Propuestas asistidas que puedes editar antes de aceptar."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          {/* Idle / start */}
          {(status === "idle" || (!activeBatchId && !isLoading)) && (
            <div className="rounded-2xl border-[1.5px] border-ink bg-white p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/60">Contexto adicional (opcional)</label>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                rows={3}
                placeholder="Ej.: enfoque, restricciones, punto de partida…"
                className="w-full rounded-xl border-[1.5px] border-ink bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
              />
              <button
                onClick={() => runGenerate()}
                disabled={isLoading || !scope}
                className="press mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-ink text-sm font-semibold text-background disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" /> Generar sugerencias
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-[1.5px] border-ink bg-white p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-ink" />
              <div className="text-sm font-semibold text-ink">Pensando propuestas…</div>
              <div className="text-xs text-ink/60">Suele tardar entre 5 y 15 segundos.</div>
              {activeBatchId && (
                <button
                  onClick={() => cancel.mutate(activeBatchId)}
                  className="press mt-2 inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink bg-white px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  <X className="h-3.5 w-3.5" /> Cancelar
                </button>
              )}
            </div>
          )}

          {/* Failed */}
          {status === "failed" && (
            <div className="rounded-2xl border-[1.5px] border-ink bg-white p-4">
              <div className="flex items-start gap-2 text-sm text-ink">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div>No se pudo completar la generación ({batch?.failure_code ?? "error"}).</div>
              </div>
              <button
                onClick={() => runGenerate(activeBatchId ?? undefined)}
                className="press mt-3 inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-3 py-1.5 text-xs font-semibold text-background"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reintentar
              </button>
            </div>
          )}

          {/* Needs context */}
          {status === "needs_context" && (
            <div className="rounded-2xl border-[1.5px] border-ink bg-white p-4">
              <div className="flex items-start gap-2 text-sm text-ink">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div className="font-semibold">La IA necesita más contexto</div>
              </div>
              {batch?.notice && <p className="mt-2 text-sm text-ink/80">{batch.notice}</p>}
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                rows={3}
                placeholder="Añade la información pedida…"
                className="mt-3 w-full rounded-xl border-[1.5px] border-ink bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
              />
              <button
                onClick={() => runGenerate(activeBatchId ?? undefined)}
                disabled={!extraContext.trim()}
                className="press mt-3 inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-4 text-sm font-semibold text-background disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" /> Reintentar con más contexto
              </button>
            </div>
          )}

          {/* Review */}
          {status === "completed" && activeBatchId && (
            <SuggestionReview
              batchId={activeBatchId}
              suggestions={suggestions}
              onRegenerate={() => runGenerate(activeBatchId)}
              onDone={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SuggestionReview({
  batchId, suggestions, onRegenerate, onDone,
}: {
  batchId: string;
  suggestions: AiSuggestionRow[];
  onRegenerate: () => void;
  onDone: () => void;
}) {
  const accept = useAcceptSuggestions();
  const reject = useRejectSuggestion();

  type Edited = { title: string; description: string; estimate: string; touched: boolean };
  const initial = useMemo(() => {
    const m: Record<string, Edited> = {};
    for (const s of suggestions) {
      m[s.id] = {
        title: s.edited_title ?? s.title,
        description: s.edited_description ?? s.description ?? "",
        estimate: s.estimate ?? "",
        touched: false,
      };
    }
    return m;
  }, [suggestions]);
  const [edits, setEdits] = useState<Record<string, Edited>>(initial);
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {};
    for (const x of suggestions) s[x.id] = x.status === "proposed" && !x.is_duplicate;
    return s;
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { setEdits(initial); }, [initial]);

  const pending = suggestions.filter((s) => s.status === "proposed");
  const acceptedCount = suggestions.filter((s) => s.status === "accepted").length;
  const selectedIds = pending.filter((s) => selected[s.id]).map((s) => s.id);

  const acceptSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      const items = selectedIds.map((id) => {
        const e = edits[id];
        return {
          id,
          editedTitle: e?.touched ? e.title.trim() : undefined,
          editedDescription: e?.touched ? (e.description.trim() || null) : undefined,
          editedEstimate: e?.touched ? (e.estimate.trim() || null) : undefined,
        };
      });
      const res = await accept.mutateAsync({ batchId, items });
      const ok = res.results.filter((r) => r.ok).length;
      const dups = res.results.filter((r) => r.error === "duplicate").length;
      toast.success(`${ok} tareas creadas${dups ? `, ${dups} omitidas por duplicado` : ""}.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-ink/70">
        <span>{pending.length} propuestas · {acceptedCount} aceptadas</span>
        <button onClick={onRegenerate} className="press inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink bg-white px-2.5 py-1 font-semibold text-ink">
          <RefreshCw className="h-3 w-3" /> Regenerar
        </button>
      </div>

      {suggestions.map((s) => {
        const e = edits[s.id] ?? { title: s.title, description: s.description ?? "", estimate: s.estimate ?? "", touched: false };
        const isAccepted = s.status === "accepted";
        const isRejected = s.status === "rejected";
        const expanded = expandedId === s.id;
        return (
          <div key={s.id} className={`rounded-2xl border-[1.5px] p-3 ${isAccepted ? "border-ink/30 bg-white/60" : isRejected ? "border-ink/20 bg-white/40 opacity-60" : "border-ink bg-white"}`}>
            <div className="flex items-start gap-2">
              {!isAccepted && !isRejected && (
                <input
                  type="checkbox"
                  checked={!!selected[s.id]}
                  onChange={(ev) => setSelected((prev) => ({ ...prev, [s.id]: ev.target.checked }))}
                  className="mt-1 h-4 w-4 accent-ink"
                  aria-label="Seleccionar sugerencia"
                />
              )}
              <div className="min-w-0 flex-1">
                {expanded && !isAccepted && !isRejected ? (
                  <input
                    value={e.title}
                    onChange={(ev) => setEdits((p) => ({ ...p, [s.id]: { ...e, title: ev.target.value, touched: true } }))}
                    className="w-full rounded-lg border-[1.5px] border-ink bg-white px-2 py-1 text-sm font-semibold text-ink"
                  />
                ) : (
                  <div className="text-sm font-semibold text-ink">{e.title}</div>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-ink/60">
                  {s.estimate && <span className="rounded-full border border-ink/20 px-1.5 py-0.5">⏱ {s.estimate}</span>}
                  {s.is_duplicate && <span className="rounded-full border border-ink/40 bg-surface-muted px-1.5 py-0.5">Posible duplicado</span>}
                  {isAccepted && <span className="rounded-full border border-ink/30 bg-surface-muted px-1.5 py-0.5">Aceptada</span>}
                  {isRejected && <span className="rounded-full border border-ink/30 px-1.5 py-0.5">Descartada</span>}
                </div>
                {expanded && (
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea
                      value={e.description}
                      onChange={(ev) => setEdits((p) => ({ ...p, [s.id]: { ...e, description: ev.target.value, touched: true } }))}
                      rows={2}
                      placeholder="Descripción"
                      className="w-full rounded-lg border-[1.5px] border-ink bg-white px-2 py-1 text-xs text-ink"
                    />
                    {s.smart_rationale && (
                      <div className="text-[11px] italic text-ink/60">{s.smart_rationale}</div>
                    )}
                  </div>
                )}
              </div>
              {!isAccepted && !isRejected && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setExpandedId(expanded ? null : s.id)}
                    aria-label="Editar"
                    className="press grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-ink bg-white"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => reject.mutate(s.id)}
                    aria-label="Descartar"
                    className="press grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-ink bg-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="sticky bottom-0 mt-2 flex items-center gap-2 border-t-[1.5px] border-ink bg-surface pt-3">
        <button
          onClick={acceptSelected}
          disabled={selectedIds.length === 0 || accept.isPending}
          className="press inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-ink text-sm font-semibold text-background disabled:opacity-60"
        >
          <Check className="h-4 w-4" /> Aceptar {selectedIds.length ? `(${selectedIds.length})` : ""}
        </button>
        <button
          onClick={onDone}
          className="press inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-4 text-sm font-semibold text-ink"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

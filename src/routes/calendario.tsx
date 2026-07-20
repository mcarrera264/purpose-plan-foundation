import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { AreaIconByName, areaColor, areaIconName } from "@/lib/area-visuals";
import {
  useAreas,
  useProjects,
  useTasks,
  useToggleTaskStatus,
  useRescheduleTask,
  type TaskRow,
} from "@/lib/data";
import { isoDate, today, weekBounds, formatHm } from "@/lib/time";
import { ChevronLeft, ChevronRight, Check, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario · Purpose Plan" },
      { name: "description", content: "Vista semanal de tus tareas planificadas." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string>(today());
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskRow | null>(null);

  const { data: tasks = [] } = useTasks();
  const { data: areas = [] } = useAreas(true);
  const { data: projects = [] } = useProjects({ status: "all" });
  const toggle = useToggleTaskStatus();
  const reschedule = useRescheduleTask();

  const { days } = useMemo(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + weekOffset * 7);
    return weekBounds(ref);
  }, [weekOffset]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, TaskRow[]> = {};
    for (const d of days) map[d] = [];
    for (const t of tasks) {
      if (t.scheduled_date && map[t.scheduled_date]) map[t.scheduled_date].push(t);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => {
        const ta = a.scheduled_start ?? "";
        const tb = b.scheduled_start ?? "";
        if (!ta && tb) return 1;
        if (ta && !tb) return -1;
        return ta.localeCompare(tb);
      });
    }
    return map;
  }, [days, tasks]);

  const selectedTasks = tasksByDay[selected] ?? [];
  const timed = selectedTasks.filter((t) => t.scheduled_start);
  const untimed = selectedTasks.filter((t) => !t.scheduled_start);

  const monthLabel = new Date(days[0] + "T00:00:00").toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/task-id", taskId);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDayDrop = (e: React.DragEvent, iso: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/task-id");
    if (!id) return;
    const t = tasks.find((x) => x.id === id);
    if (!t || t.scheduled_date === iso) return;
    reschedule.mutate(
      { id, scheduled_date: iso, scheduled_start: t.scheduled_start, scheduled_end: t.scheduled_end },
      {
        onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo reprogramar"),
        onSuccess: () => toast.success("Tarea reprogramada"),
      },
    );
  };

  return (
    <AppShell>
      <PageHeader
        title="Calendario"
        subtitle="Solo tus tareas de Purpose Plan, coloreadas por área."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((v) => v - 1)}
              aria-label="Semana anterior"
              className="press grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-ink bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setWeekOffset(0);
                setSelected(today());
              }}
              className="press inline-flex h-11 items-center rounded-full border-[1.5px] border-ink bg-white px-4 text-sm font-semibold text-ink"
            >
              Hoy
            </button>
            <button
              onClick={() => setWeekOffset((v) => v + 1)}
              aria-label="Semana siguiente"
              className="press grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-ink bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="mb-4 text-sm font-semibold capitalize text-text-secondary">{monthLabel}</div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {days.map((iso) => {
            const d = new Date(iso + "T00:00:00");
            const isSel = iso === selected;
            const isToday = iso === today();
            const list = tasksByDay[iso];
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => onDayDrop(e, iso)}
                aria-pressed={isSel}
                aria-label={`${d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}${isSel ? ", seleccionado" : ""}`}
                className={[
                  "press flex min-h-[140px] flex-col rounded-2xl border-[1.5px] border-ink p-2 text-left transition md:min-h-[220px] md:p-3",
                  isSel ? "bg-ink text-background" : "bg-white text-ink",
                ].join(" ")}
              >
                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                  <span className={isSel ? "text-background/80" : "text-text-secondary"}>
                    {d.toLocaleDateString("es-ES", { weekday: "short" })}
                  </span>
                  <span
                    className={[
                      "grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold",
                      isToday && !isSel ? "border-[1.5px] border-ink bg-[var(--area-career)] text-ink" : "",
                      isSel ? "bg-background text-ink" : "",
                    ].join(" ")}
                  >
                    {d.getDate()}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  {list.slice(0, 4).map((t) => {
                    const a = areas.find((x) => x.id === t.area_id) ?? null;
                    const done = t.status === "done";
                    const overdue = !done && t.scheduled_date && t.scheduled_date < today();
                    return (
                      <span
                        key={t.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, t.id)}
                        className="truncate rounded-md border-[1.5px] border-ink px-1.5 py-0.5 text-[11px] font-semibold text-ink"
                        style={{
                          backgroundColor: done ? "#fff" : areaColor(a),
                          textDecoration: done ? "line-through" : undefined,
                          opacity: done ? 0.7 : 1,
                          outline: overdue ? "1.5px dashed hsl(var(--destructive))" : undefined,
                        }}
                        title={t.title}
                      >
                        {t.scheduled_start ? `${formatHm(t.scheduled_start)} · ` : ""}
                        {t.title}
                      </span>
                    );
                  })}
                  {list.length > 4 ? (
                    <span className={`text-[11px] ${isSel ? "text-background/80" : "text-text-secondary"}`}>
                      +{list.length - 4} más
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <aside className="rounded-2xl border-[1.5px] border-ink bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Día seleccionado
              </div>
              <h2 className="mt-1 text-xl font-extrabold capitalize text-ink">
                {new Date(selected + "T00:00:00").toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label="Nueva tarea este día"
              className="press grid h-10 w-10 place-items-center rounded-full border-[1.5px] border-ink bg-ink text-background"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {selectedTasks.length === 0 ? (
            <EmptyState
              title="Día libre"
              description="No tienes tareas planificadas."
              action={
                <button
                  onClick={() => setCreateOpen(true)}
                  className="press inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-5 text-sm font-semibold text-background"
                >
                  <Plus className="h-4 w-4" /> Añadir tarea
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {timed.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Con hora
                  </h3>
                  <ul className="space-y-2">
                    {timed.map((t) => (
                      <DayTaskItem
                        key={t.id}
                        task={t}
                        areaColor={areaColor(areas.find((x) => x.id === t.area_id) ?? null)}
                        areaIcon={areaIconName(areas.find((x) => x.id === t.area_id) ?? null)}
                        projectName={projects.find((p) => p.id === t.project_id)?.name}
                        onToggle={() =>
                          toggle.mutate({ id: t.id, next: t.status === "done" ? "todo" : "done" })
                        }
                        onEdit={() => setEditTask(t)}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}
              {untimed.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Sin hora
                  </h3>
                  <ul className="space-y-2">
                    {untimed.map((t) => (
                      <DayTaskItem
                        key={t.id}
                        task={t}
                        areaColor={areaColor(areas.find((x) => x.id === t.area_id) ?? null)}
                        areaIcon={areaIconName(areas.find((x) => x.id === t.area_id) ?? null)}
                        projectName={projects.find((p) => p.id === t.project_id)?.name}
                        onToggle={() =>
                          toggle.mutate({ id: t.id, next: t.status === "done" ? "todo" : "done" })
                        }
                        onEdit={() => setEditTask(t)}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </aside>
      </div>

      <TaskFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialDate={selected}
      />
      <TaskFormDialog
        open={!!editTask}
        onOpenChange={(v) => !v && setEditTask(null)}
        task={editTask}
      />
    </AppShell>
  );
}

function DayTaskItem({
  task,
  areaColor,
  areaIcon,
  projectName,
  onToggle,
  onEdit,
}: {
  task: TaskRow;
  areaColor: string;
  areaIcon: string;
  projectName?: string;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const done = task.status === "done";
  const overdue = !done && task.scheduled_date && task.scheduled_date < today();
  const time = task.scheduled_start
    ? task.scheduled_end
      ? `${formatHm(task.scheduled_start)} – ${formatHm(task.scheduled_end)}`
      : formatHm(task.scheduled_start)
    : "Sin hora";
  return (
    <li
      className="flex items-center gap-3 rounded-xl border-[1.5px] border-ink p-2"
      style={{ backgroundColor: done ? "#fff" : areaColor, opacity: done ? 0.75 : 1 }}
    >
      <button
        onClick={onToggle}
        aria-label={done ? "Marcar pendiente" : "Marcar completada"}
        aria-pressed={done}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-white"
      >
        {done ? <Check className="animate-check h-4 w-4" strokeWidth={3} /> : null}
      </button>
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-[1.5px] border-ink bg-white/70">
        <AreaIconByName name={areaIcon} />
      </div>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className={`truncate text-sm font-semibold text-ink ${done ? "line-through" : ""}`}>
          {task.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink/70">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {time}
          </span>
          {projectName ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{projectName}</span>
            </>
          ) : null}
          {overdue ? (
            <>
              <span aria-hidden>·</span>
              <span className="font-semibold text-destructive">Vencida</span>
            </>
          ) : null}
        </div>
      </button>
    </li>
  );
}

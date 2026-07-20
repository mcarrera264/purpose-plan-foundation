import { Check, Clock } from "lucide-react";
import { AreaIconByName, areaColor, areaIconName } from "@/lib/area-visuals";
import { useAreas, useProjects, useToggleTaskStatus, type TaskRow as Task } from "@/lib/data";

function formatWhen(date: string | null, start: string | null) {
  if (!date) return "Sin programar";
  const d = new Date(date + "T00:00:00");
  const label = d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  if (start) {
    const t = new Date(start);
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    return `${label}, ${hh}:${mm}`;
  }
  return label;
}

export function TaskRow({
  task,
  showProject = true,
  indent = 0,
}: {
  task: Task;
  showProject?: boolean;
  indent?: number;
}) {
  const { data: areas = [] } = useAreas(true);
  const { data: projects = [] } = useProjects({ status: "all" });
  const toggle = useToggleTaskStatus();
  const area = areas.find((a) => a.id === task.area_id) ?? null;
  const project = task.project_id ? projects.find((p) => p.id === task.project_id) : undefined;

  const completed = task.status === "done";
  const overdue = !completed && task.scheduled_date && task.scheduled_date < new Date().toISOString().slice(0, 10);

  return (
    <div
      className="press group flex items-center gap-3 rounded-2xl border-[1.5px] border-ink p-3 transition"
      style={{
        backgroundColor: completed ? "#ffffff" : areaColor(area),
        marginLeft: indent * 20,
        opacity: completed ? 0.75 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => toggle.mutate({ id: task.id, next: completed ? "todo" : "done" })}
        aria-label={completed ? "Marcar como pendiente" : "Marcar como completada"}
        aria-pressed={completed}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        {completed ? <Check className="animate-check h-4 w-4" strokeWidth={3} /> : null}
      </button>

      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-[1.5px] border-ink bg-white/70">
        <AreaIconByName name={areaIconName(area)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className={`truncate text-[15px] font-semibold text-ink ${completed ? "line-through decoration-2" : ""}`}>
          {task.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink/70">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatWhen(task.scheduled_date, task.scheduled_start)}
          </span>
          {showProject && project ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{project.name}</span>
            </>
          ) : null}
          {overdue ? (
            <>
              <span aria-hidden>·</span>
              <span className="font-semibold text-destructive">Vencida</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

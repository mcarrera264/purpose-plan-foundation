import { Check, Clock } from "lucide-react";
import type { Task } from "@/lib/mock-data";
import { AREAS, getProject } from "@/lib/mock-data";
import { toggleTask, useTaskStatus } from "@/lib/task-store";
import { AreaIcon } from "./AreaChip";

function formatDate(iso?: string, time?: string) {
  if (!iso) return "Sin programar";
  const d = new Date(iso);
  const label = d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return time ? `${label}, ${time}` : label;
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
  const status = useTaskStatus(task.id);
  const area = AREAS[task.areaId];
  const project = task.projectId ? getProject(task.projectId) : undefined;
  const overdue = status !== "completed" && task.date && new Date(task.date) < new Date(new Date().toDateString());
  const completed = status === "completed";

  return (
    <div
      className="press group flex items-center gap-3 rounded-2xl border-[1.5px] border-ink p-3 transition"
      style={{
        backgroundColor: completed ? "#ffffff" : area.color,
        marginLeft: indent * 20,
        opacity: completed ? 0.75 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => toggleTask(task.id)}
        aria-label={completed ? "Marcar como pendiente" : "Marcar como completada"}
        aria-pressed={completed}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        {completed ? <Check className="animate-check h-4 w-4" strokeWidth={3} /> : null}
      </button>

      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-[1.5px] border-ink bg-white/70">
        <AreaIcon areaId={task.areaId} className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className={`truncate text-[15px] font-semibold text-ink ${completed ? "line-through decoration-2" : ""}`}>
          {task.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink/70">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(task.date, task.time)}
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

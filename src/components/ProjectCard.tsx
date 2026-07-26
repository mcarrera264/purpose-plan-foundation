import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { areaColor, areaIconName, AreaIconByName } from "@/lib/area-visuals";
import { ProgressBar } from "./ProgressBar";
import { TaskTree } from "./TaskTree";
import { useAreas, useTasks, projectProgressPct, type ProjectRow } from "@/lib/data";

function formatDate(iso: string | null) {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function ProjectCard({
  project,
  open: openProp,
  onOpenChange,
}: {
  project: ProjectRow;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setOpenState(v));
  const { data: areas = [] } = useAreas(true);
  const { data: tasks = [] } = useTasks();
  const area = areas.find((a) => a.id === project.area_id) ?? null;
  const color = areaColor(area);
  const pct = projectProgressPct(tasks, project.id);
  const projectTasks = tasks.filter((t) => t.project_id === project.id);
  const rootTasks = projectTasks.filter((t) => !t.parent_task_id);
  const activeTask = projectTasks.find((t) => t.status === "todo") ?? null;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group rounded-2xl border-[1.5px] border-ink transition"
      style={{ backgroundColor: color, viewTransitionName: `project-${project.id}` }}
    >

      <CollapsibleTrigger
        className="press w-full rounded-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`${project.name} — ${pct}% completado. ${open ? "Ocultar" : "Ver"} tareas`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold leading-tight text-ink">{project.name}</h3>
            <div className="mt-1 text-xs font-medium text-ink/70">{formatDate(project.target_date)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-white/70">
              <AreaIconByName name={areaIconName(area)} />
            </div>
            <ChevronDown
              className={`h-5 w-5 text-ink transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </div>
        </div>
        {activeTask && !open ? (
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">Tarea activa</div>
            <div className="mt-1 flex items-center gap-2 rounded-xl border-[1.5px] border-ink bg-white/80 px-3 py-2">
              <AreaIconByName name={areaIconName(area)} />
              <span className="truncate text-sm font-semibold text-ink">{activeTask.title}</span>
            </div>
          </div>
        ) : null}
        <div className="mt-4">
          <ProgressBar value={pct} label="Completado" size="sm" />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent
        className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
      >
        <div className="border-t-[1.5px] border-ink/70 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">
              Tareas del proyecto ({rootTasks.length})
            </div>
            <Link
              to="/proyectos/$projectId"
              params={{ projectId: project.id }}
              className="press inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink bg-white/80 px-3 py-1 text-xs font-semibold text-ink"
            >
              Abrir <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {rootTasks.length === 0 ? (
            <div className="rounded-xl border-[1.5px] border-dashed border-ink/40 bg-white/60 p-4 text-center text-sm text-ink/70">
              Este proyecto aún no tiene tareas.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rootTasks.map((t) => (
                <TaskRow key={t.id} task={t} showProject={false} />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

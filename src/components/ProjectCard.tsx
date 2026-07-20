import { Link } from "@tanstack/react-router";
import { areaColor, areaIconName, AreaIconByName } from "@/lib/area-visuals";
import { ProgressBar } from "./ProgressBar";
import { useAreas, useTasks, projectProgressPct, type ProjectRow } from "@/lib/data";

function formatDate(iso: string | null) {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function ProjectCard({ project }: { project: ProjectRow }) {
  const { data: areas = [] } = useAreas(true);
  const { data: tasks = [] } = useTasks();
  const area = areas.find((a) => a.id === project.area_id) ?? null;
  const color = areaColor(area);
  const pct = projectProgressPct(tasks, project.id);
  const activeTask = tasks.find((t) => t.project_id === project.id && t.status === "todo") ?? null;

  return (
    <Link
      to="/proyectos/$projectId"
      params={{ projectId: project.id }}
      className="press group block rounded-2xl border-[1.5px] border-ink p-4 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ backgroundColor: color, viewTransitionName: `project-${project.id}` }}
      aria-label={`${project.name} — ${pct}% completado`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold leading-tight text-ink">{project.name}</h3>
          <div className="mt-1 text-xs font-medium text-ink/70">{formatDate(project.target_date)}</div>
        </div>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-white/70">
          <AreaIconByName name={areaIconName(area)} />
        </div>
      </div>
      {activeTask ? (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">Tarea activa</div>
          <div className="mt-1 flex items-center gap-2 rounded-xl border-[1.5px] border-ink bg-white/80 px-3 py-2">
            <AreaIconByName name={areaIconName(area)} />
            <span className="truncate text-sm font-semibold text-ink">{activeTask.title}</span>
          </div>
        </div>
      ) : null}
      <div className="mt-4"><ProgressBar value={pct} label="Completado" size="sm" /></div>
    </Link>
  );
}

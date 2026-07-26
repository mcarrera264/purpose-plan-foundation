import { useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { AreaIconByName, areaColor, areaIconName } from "@/lib/area-visuals";
import { useAreas, useTasks, projectProgressPct, type ProjectRow } from "@/lib/data";

/**
 * Grid of projects with a "focus mode": when a project is expanded it takes the
 * full available width and the remaining projects collapse into small chips
 * aligned to the top-left, so the open project can be read across the screen.
 */
export function ProjectGrid({
  projects,
  gridClassName = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}: {
  projects: ProjectRow[];
  gridClassName?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openProject = projects.find((p) => p.id === openId) ?? null;

  if (!openProject) {
    return (
      <div className={gridClassName}>
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} open={false} onOpenChange={(v) => setOpenId(v ? p.id : null)} />
        ))}
      </div>
    );
  }

  const others = projects.filter((p) => p.id !== openProject.id);

  return (
    <div className="flex flex-col gap-4">
      {others.length > 0 ? (
        <div className="animate-expand flex flex-wrap items-center gap-2">
          {others.map((p) => (
            <MiniProjectChip key={p.id} project={p} onSelect={() => setOpenId(p.id)} />
          ))}
        </div>
      ) : null}

      <div className="w-full">
        <ProjectCard project={openProject} open onOpenChange={(v) => setOpenId(v ? openProject.id : null)} />
      </div>
    </div>
  );
}

function MiniProjectChip({ project, onSelect }: { project: ProjectRow; onSelect: () => void }) {
  const { data: areas = [] } = useAreas(true);
  const { data: tasks = [] } = useTasks();
  const area = areas.find((a) => a.id === project.area_id) ?? null;
  const pct = projectProgressPct(tasks, project.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      title={project.name}
      className="press flex max-w-[220px] items-center gap-2 rounded-full border-[1.5px] border-ink px-3 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      style={{ backgroundColor: areaColor(area) }}
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-white/70">
        <AreaIconByName name={areaIconName(area)} />
      </span>
      <span className="truncate text-xs font-bold text-ink">{project.name}</span>
      <span className="shrink-0 text-[11px] font-semibold text-ink/60">{pct}%</span>
    </button>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { TaskRow } from "@/components/TaskRow";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { CreateMenu } from "@/components/CreateMenu";
import { useTasks, type TaskRow as Task } from "@/lib/data";
import { ListChecks, Plus } from "lucide-react";

export const Route = createFileRoute("/tareas")({
  head: () => ({
    meta: [
      { title: "Tareas · Purpose Plan" },
      { name: "description", content: "Vencidas, hoy, mañana, esta semana y sin programar." },
    ],
  }),
  component: TasksPage,
});

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function endOfWeekIso() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (7 - day));
  return d.toISOString().slice(0, 10);
}

function TasksPage() {
  const [query, setQuery] = useState("");
  const [areas, setAreas] = useState<Set<string>>(new Set());
  const { data: tasks = [], isLoading } = useTasks();
  const TODAY = todayIso();
  const TOMORROW = tomorrowIso();
  const eow = endOfWeekIso();

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (areas.size > 0 && (!t.area_id || !areas.has(t.area_id))) return false;
        if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [tasks, query, areas],
  );

  // Only tasks whose parent is not visible act as branch roots; children are
  // rendered nested under them with indentation.
  const visibleIds = useMemo(() => new Set(filtered.map((t) => t.id)), [filtered]);
  const roots = useMemo(
    () => filtered.filter((t) => !t.parent_task_id || !visibleIds.has(t.parent_task_id)),
    [filtered, visibleIds],
  );

  const groups: { label: string; tasks: Task[] }[] = [
    { label: "Vencidas", tasks: roots.filter((t) => t.scheduled_date && t.scheduled_date < TODAY && t.status !== "done") },
    { label: "Hoy", tasks: roots.filter((t) => t.scheduled_date === TODAY) },
    { label: "Mañana", tasks: roots.filter((t) => t.scheduled_date === TOMORROW) },
    { label: "Esta semana", tasks: roots.filter((t) => t.scheduled_date && t.scheduled_date > TOMORROW && t.scheduled_date <= eow) },
    { label: "Sin programar", tasks: roots.filter((t) => !t.scheduled_date) },
  ];


  return (
    <AppShell>
      <PageHeader
        title="Tareas"
        subtitle="Enfócate en lo que toca hoy y esta semana."
        actions={
          <CreateMenu>
            <button className="press inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-4 text-sm font-semibold text-background">
              <Plus className="h-4 w-4" /> Nueva
            </button>
          </CreateMenu>
        }
      />

      <SearchAndFilter
        query={query}
        onQueryChange={setQuery}
        activeAreaIds={areas}
        onToggleAreaId={(id) => {
          const next = new Set(areas);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          setAreas(next);
        }}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-8 w-8" />}
          title={tasks.length === 0 ? "Aún no tienes tareas" : "Sin tareas visibles"}
          description={tasks.length === 0 ? "Añade tu primera tarea para empezar a organizarte." : "Ajusta la búsqueda o los filtros para ver más tareas."}
          action={
            tasks.length === 0 ? (
              <CreateMenu>
                <button className="press inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-5 text-sm font-semibold text-background">
                  <Plus className="h-4 w-4" /> Nueva tarea
                </button>
              </CreateMenu>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map((g) =>
            g.tasks.length === 0 ? null : (
              <section key={g.label}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-xl font-extrabold text-ink">{g.label}</h2>
                  <span className="text-xs font-semibold text-text-secondary">{g.tasks.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {g.tasks.map((t) => (
                    <TaskBranch key={t.id} task={t} all={filtered} level={0} />
                  ))}
                </div>

              </section>
            ),
          )}
        </div>
      )}
    </AppShell>
  );
}

/** Renders a task and its visible descendants with progressive indentation. */
function TaskBranch({ task, all, level }: { task: Task; all: Task[]; level: number }) {
  const children = all.filter((t) => t.parent_task_id === task.id);
  return (
    <div className="flex flex-col gap-2">
      <TaskRow task={task} indent={level} />
      {children.map((c) => (
        <TaskBranch key={c.id} task={c} all={all} level={level + 1} />
      ))}
    </div>
  );
}


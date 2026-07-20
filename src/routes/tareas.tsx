import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { TaskRow } from "@/components/TaskRow";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { EmptyState } from "@/components/EmptyState";
import { TASKS, TODAY_ISO, TOMORROW_ISO, type AreaId, type Task } from "@/lib/mock-data";
import { useTasksVersion } from "@/lib/task-store";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/tareas")({
  head: () => ({
    meta: [
      { title: "Tareas · Purpose Plan" },
      { name: "description", content: "Vencidas, hoy, mañana, esta semana y sin programar." },
    ],
  }),
  component: TasksPage,
});

function endOfWeekIso() {
  const d = new Date();
  const day = d.getDay();
  const daysToSunday = 7 - day;
  d.setDate(d.getDate() + daysToSunday);
  return d.toISOString().slice(0, 10);
}

function TasksPage() {
  useTasksVersion();
  const [query, setQuery] = useState("");
  const [areas, setAreas] = useState<Set<AreaId>>(new Set());
  const eow = endOfWeekIso();

  const filtered = useMemo(
    () =>
      TASKS.filter((t) => {
        if (areas.size > 0 && !areas.has(t.areaId)) return false;
        if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [query, areas],
  );

  const groups: { label: string; tasks: Task[] }[] = [
    {
      label: "Vencidas",
      tasks: filtered.filter((t) => t.date && t.date < TODAY_ISO && t.status !== "completed"),
    },
    { label: "Hoy", tasks: filtered.filter((t) => t.date === TODAY_ISO) },
    { label: "Mañana", tasks: filtered.filter((t) => t.date === TOMORROW_ISO) },
    {
      label: "Esta semana",
      tasks: filtered.filter((t) => t.date && t.date > TOMORROW_ISO && t.date <= eow),
    },
    { label: "Sin programar", tasks: filtered.filter((t) => !t.date) },
  ];

  const totalTasks = filtered.length;

  return (
    <AppShell>
      <PageHeader title="Tareas" subtitle="Enfócate en lo que toca hoy y esta semana." />
      <SearchAndFilter
        query={query}
        onQueryChange={setQuery}
        activeAreas={areas}
        onToggleArea={(id) => {
          const next = new Set(areas);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          setAreas(next);
        }}
      />

      {totalTasks === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-8 w-8" />}
          title="Sin tareas visibles"
          description="Ajusta la búsqueda o los filtros para ver más tareas."
        />
      ) : (
        <div className="space-y-8">
          {groups.map((g) =>
            g.tasks.length === 0 ? null : (
              <section key={g.label}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-xl font-extrabold text-ink">{g.label}</h2>
                  <span className="text-xs font-semibold text-text-secondary">
                    {g.tasks.length} {g.tasks.length === 1 ? "tarea" : "tareas"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {g.tasks.map((t) => (
                    <TaskRow key={t.id} task={t} />
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

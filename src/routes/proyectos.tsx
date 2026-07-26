import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProjectGrid } from "@/components/ProjectGrid";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { CreateMenu } from "@/components/CreateMenu";
import { FolderKanban, Plus } from "lucide-react";
import { useProjects } from "@/lib/data";

export const Route = createFileRoute("/proyectos")({
  head: () => ({
    meta: [
      { title: "Proyectos · Purpose Plan" },
      { name: "description", content: "Explora y gestiona todos tus proyectos por área." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [areas, setAreas] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"active" | "all" | "archived" | "completed">("active");
  const { data: projects = [], isLoading } = useProjects({ status: statusFilter });

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (areas.size > 0 && (!p.area_id || !areas.has(p.area_id))) return false;
        if (query && !`${p.name} ${p.description ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [projects, query, areas],
  );

  return (
    <AppShell>
      <PageHeader
        title="Proyectos"
        subtitle="Todos tus objetivos con horizonte y progreso."
        actions={
          <CreateMenu>
            <button className="press inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-4 text-sm font-semibold text-background">
              <Plus className="h-4 w-4" /> Nuevo
            </button>
          </CreateMenu>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {(["active", "completed", "archived", "all"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={[
              "press rounded-full border-[1.5px] border-ink px-3 py-1 text-xs font-semibold",
              statusFilter === s ? "bg-ink text-background" : "bg-white text-ink",
            ].join(" ")}
          >
            {s === "active" ? "Activos" : s === "completed" ? "Completados" : s === "archived" ? "Archivados" : "Todos"}
          </button>
        ))}
      </div>

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
        placeholder="Buscar proyecto"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title={projects.length === 0 ? "Aún no tienes proyectos" : "Sin resultados"}
          description={projects.length === 0 ? "Crea tu primer proyecto para empezar." : "Prueba a limpiar los filtros o cambiar tu búsqueda."}
          action={
            projects.length === 0 ? (
              <CreateMenu>
                <button className="press inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-5 text-sm font-semibold text-background">
                  <Plus className="h-4 w-4" /> Nuevo proyecto
                </button>
              </CreateMenu>
            ) : undefined
          }
        />
      ) : (
        <ProjectGrid projects={filtered} />

      )}
    </AppShell>
  );
}

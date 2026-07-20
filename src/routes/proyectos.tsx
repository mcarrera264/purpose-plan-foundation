import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { EmptyState } from "@/components/EmptyState";
import { PROJECTS, type AreaId } from "@/lib/mock-data";
import { FolderKanban } from "lucide-react";

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
  const [areas, setAreas] = useState<Set<AreaId>>(new Set());

  const filtered = useMemo(() => {
    return PROJECTS.filter((p) => {
      if (areas.size > 0 && !areas.has(p.areaId)) return false;
      if (query && !`${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, areas]);

  return (
    <AppShell>
      <PageHeader title="Proyectos" subtitle="Todos tus objetivos con horizonte y progreso." />
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
        placeholder="Buscar proyecto"
      />
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="Sin resultados"
          description="Prueba a limpiar los filtros o cambiar tu búsqueda."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

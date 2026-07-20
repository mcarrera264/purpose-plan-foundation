import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { AREA_LIST, type AreaId } from "@/lib/mock-data";
import { AreaChip } from "./AreaChip";

export function SearchAndFilter({
  query,
  onQueryChange,
  activeAreas,
  onToggleArea,
  placeholder = "Buscar tarea o proyecto",
}: {
  query: string;
  onQueryChange: (v: string) => void;
  activeAreas: Set<AreaId>;
  onToggleArea: (id: AreaId) => void;
  placeholder?: string;
}) {
  const [showFilters, setShowFilters] = useState(false);
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="h-12 w-full rounded-full border-[1.5px] border-ink bg-white pl-11 pr-4 text-sm text-ink placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-background"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label="Filtros"
          className="press grid h-12 w-12 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-white"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>
      {showFilters ? (
        <div className="animate-expand flex flex-wrap gap-2">
          {AREA_LIST.map((a) => (
            <AreaChip key={a.id} area={a} active={activeAreas.has(a.id)} onClick={() => onToggleArea(a.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

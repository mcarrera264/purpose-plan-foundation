import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useAreas, type AreaRow } from "@/lib/data";
import { AreaIconByName, areaColor, areaIconName } from "@/lib/area-visuals";

export function SearchAndFilter({
  query,
  onQueryChange,
  activeAreaIds,
  onToggleAreaId,
  placeholder = "Buscar",
}: {
  query: string;
  onQueryChange: (v: string) => void;
  activeAreaIds: Set<string>;
  onToggleAreaId: (id: string) => void;
  placeholder?: string;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const { data: areas = [] } = useAreas();
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
          {areas.map((a) => (
            <AreaChipButton key={a.id} area={a} active={activeAreaIds.has(a.id)} onClick={() => onToggleAreaId(a.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AreaChipButton({ area, active, onClick }: { area: AreaRow; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "press inline-flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 text-xs font-semibold",
        active ? "border-ink bg-ink text-background" : "border-ink text-ink",
      ].join(" ")}
      style={active ? undefined : { backgroundColor: areaColor(area) }}
    >
      <AreaIconByName name={areaIconName(area)} className="h-3.5 w-3.5" />
      <span>{area.name}</span>
    </button>
  );
}

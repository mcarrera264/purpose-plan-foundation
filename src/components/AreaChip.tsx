import { Briefcase, Heart, DollarSign, Users } from "lucide-react";
import type { Area, AreaId } from "@/lib/mock-data";
import { AREAS } from "@/lib/mock-data";

const iconMap = {
  briefcase: Briefcase,
  heart: Heart,
  "dollar-sign": DollarSign,
  users: Users,
} as const;

export function AreaIcon({ areaId, className = "h-4 w-4" }: { areaId: AreaId; className?: string }) {
  const Icon = iconMap[AREAS[areaId].icon as keyof typeof iconMap] ?? Briefcase;
  return <Icon className={className} strokeWidth={2.25} aria-hidden />;
}

export function AreaChip({
  area,
  active,
  onClick,
}: {
  area: Area;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={[
        "press inline-flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5 text-xs font-semibold",
        active ? "border-ink bg-ink text-background" : "border-ink bg-white text-ink",
      ].join(" ")}
      style={active ? undefined : { backgroundColor: area.color, color: "var(--ink)" }}
    >
      <AreaIcon areaId={area.id} className="h-3.5 w-3.5" />
      <span>{area.name}</span>
    </Comp>
  );
}

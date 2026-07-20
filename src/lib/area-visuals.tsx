// Colour + icon helpers for both system and custom areas.
import { Briefcase, Heart, DollarSign, Users, Sparkles, Target, BookOpen, Home, Leaf, Palette, Music, Plane, type LucideIcon } from "lucide-react";
import type { AreaRow } from "@/lib/data";

export const AREA_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  heart: Heart,
  "dollar-sign": DollarSign,
  users: Users,
  sparkles: Sparkles,
  target: Target,
  "book-open": BookOpen,
  home: Home,
  leaf: Leaf,
  palette: Palette,
  music: Music,
  plane: Plane,
};

export const AREA_ICON_OPTIONS = Object.keys(AREA_ICONS);

export const AREA_COLOR_SWATCHES = [
  "#D1D1FF", // career
  "#D4F3DC", // health
  "#FFCDAC", // finance
  "#FCBADC", // social
  "#FFE7A0",
  "#B8E1FF",
  "#F2C8FF",
  "#C0F0EA",
];

export function areaColor(area: Pick<AreaRow, "color"> | null | undefined) {
  return area?.color ?? "#F2F2F2";
}
export function areaIconName(area: Pick<AreaRow, "icon"> | null | undefined) {
  const k = area?.icon ?? "sparkles";
  return AREA_ICONS[k] ? k : "sparkles";
}
export function AreaIconByName({ name, className }: { name: string; className?: string }) {
  const Icon = AREA_ICONS[name] ?? Sparkles;
  return <Icon className={className ?? "h-4 w-4"} strokeWidth={2.25} aria-hidden />;
}

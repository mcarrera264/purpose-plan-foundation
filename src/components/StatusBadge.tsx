import type { ReactNode } from "react";

type Variant = "default" | "completed" | "overdue" | "archived" | "loading";

const styles: Record<Variant, string> = {
  default: "bg-white text-ink",
  completed: "bg-[var(--area-health)] text-ink",
  overdue: "bg-destructive text-destructive-foreground",
  archived: "bg-surface-muted text-text-secondary",
  loading: "bg-surface-muted text-text-secondary",
};

export function StatusBadge({ variant = "default", children }: { variant?: Variant; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink px-2.5 py-0.5 text-[11px] font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

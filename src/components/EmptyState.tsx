import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-ink bg-white px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-ink/70">{icon}</div> : null}
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-text-secondary">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

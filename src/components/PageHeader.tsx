import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 pb-6 md:pb-8">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-sm font-medium text-text-secondary">{eyebrow}</div>
        ) : null}
        <h1 className="truncate text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-text-secondary md:text-base">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

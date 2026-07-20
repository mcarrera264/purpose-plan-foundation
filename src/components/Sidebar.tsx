import { Link, useRouterState } from "@tanstack/react-router";
import { Home, FolderKanban, ListChecks, CalendarDays, Trophy, Plus, User } from "lucide-react";
import { CreateMenu } from "./CreateMenu";

const items = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { to: "/tareas", label: "Tareas", icon: ListChecks },
  { to: "/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/progreso", label: "Progreso", icon: Trophy },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink bg-white p-5 md:flex">
      <Link to="/" className="mb-8 flex items-center gap-2">
        <div className="grid h-10 w-10 place-items-center rounded-full border-[1.5px] border-ink bg-[var(--area-career)]">
          <span className="font-bold text-ink">P</span>
        </div>
        <span className="text-xl font-extrabold tracking-tight text-ink">Purpose Plan</span>
      </Link>

      <CreateMenu>
        <button
          type="button"
          className="press mb-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-ink text-[15px] font-semibold text-background hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Crear
        </button>
      </CreateMenu>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={[
                "press flex items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3 text-[15px] font-medium",
                active
                  ? "border-ink bg-surface-muted text-ink"
                  : "border-transparent text-ink/80 hover:border-ink hover:bg-white",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border-[1.5px] border-ink bg-white p-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-surface-muted">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">Invitado</div>
          <div className="truncate text-xs text-text-secondary">Perfil próximamente</div>
        </div>
      </div>
    </aside>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ListChecks, CalendarDays, Trophy, Plus, FolderKanban } from "lucide-react";
import { CreateMenu } from "./CreateMenu";

type NavItemDef = { to: string; label: string; icon: typeof Home; exact?: boolean };
const items: NavItemDef[] = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { to: "/tareas", label: "Tareas", icon: ListChecks },
  { to: "/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/progreso", label: "Progreso", icon: Trophy },
];

export function MobileNavigation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const left = items.slice(0, 2);
  const right = items.slice(2);

  return (
    <nav
      aria-label="Principal móvil"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-1 rounded-full border-[1.5px] border-ink bg-white px-2 py-2 shadow-[0_8px_24px_-12px_rgba(10,10,10,0.25)] md:hidden"
    >
      {left.map((it) => (
        <NavItem key={it.to} to={it.to} label={it.label} Icon={it.icon} active={it.exact ? pathname === it.to : pathname.startsWith(it.to)} />
      ))}
      <CreateMenu>
        <button
          type="button"
          aria-label="Crear"
          className="press grid h-14 w-14 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-ink text-background"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </CreateMenu>
      {right.map((it) => (
        <NavItem key={it.to} to={it.to} label={it.label} Icon={it.icon} active={it.exact ? pathname === it.to : pathname.startsWith(it.to)} />
      ))}
    </nav>
  );
}

function NavItem({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={[
        "press grid h-11 w-11 place-items-center rounded-full",
        active ? "bg-surface-muted text-ink" : "text-ink/70",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
    </Link>
  );
}

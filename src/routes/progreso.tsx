import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar, SegmentedProgressBar } from "@/components/ProgressBar";
import { EmptyState } from "@/components/EmptyState";
import { useAreas, useProjects, useTasks } from "@/lib/data";
import { dayProgress, projectLeafProgress, weekProgress } from "@/lib/progress";
import { today, formatShortDate } from "@/lib/time";
import { Trophy, ArrowRight, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/progreso")({
  head: () => ({
    meta: [
      { title: "Progreso · Purpose Plan" },
      { name: "description", content: "Cumplimiento diario, semanal y por proyecto." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { data: tasks = [] } = useTasks();
  const { data: areas = [] } = useAreas();
  const { data: projects = [] } = useProjects({ status: "active" });

  const day = useMemo(() => dayProgress(tasks, today()), [tasks]);
  const week = useMemo(() => weekProgress(tasks), [tasks]);

  const daySegments = areas.map((a) => ({
    color: a.color ?? "#F2F2F2",
    value: Math.max(day.tasks.filter((t) => t.area_id === a.id && t.status === "done").length, 0.001),
    label: a.name,
  }));
  const weekSegments = areas.map((a) => ({
    color: a.color ?? "#F2F2F2",
    value: Math.max(week.tasks.filter((t) => t.area_id === a.id && t.status === "done").length, 0.001),
    label: a.name,
  }));

  const [celebrate, setCelebrate] = useState(false);
  const [prevPct, setPrevPct] = useState(day.pct);
  useEffect(() => {
    if (day.total > 0 && day.pct >= 100 && prevPct < 100) {
      setCelebrate(true);
      const to = setTimeout(() => setCelebrate(false), 900);
      return () => clearTimeout(to);
    }
    setPrevPct(day.pct);
  }, [day.pct, day.total, prevPct]);

  return (
    <AppShell>
      <PageHeader title="Progreso" subtitle="Cómo avanzas hoy, esta semana y por proyecto." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today */}
        <section className="relative overflow-hidden rounded-2xl border-[1.5px] border-ink bg-ink p-6 text-background">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-background/70">Hoy</div>
              <h2 className="mt-1 text-2xl font-extrabold">
                {day.total === 0
                  ? "Sin tareas para hoy"
                  : day.pct >= 100
                    ? "¡Lo has clavado!"
                    : day.pct >= 60
                      ? "Casi lo tienes"
                      : "Vamos a por ello"}
              </h2>
              <p className="mt-1 text-sm text-background/80">
                {day.total === 0
                  ? "Programa una tarea para empezar a medir tu progreso."
                  : `${day.done} de ${day.total} tareas completadas`}
              </p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-full border-[1.5px] border-background">
              <Trophy className="h-7 w-7" aria-hidden />
            </div>
          </div>
          <div className="mt-5" aria-hidden={day.total === 0}>
            {day.total === 0 ? (
              <div className="rounded-full border-[1.5px] border-dashed border-background/50 px-3 py-2 text-xs text-background/70">
                Aún no hay tareas programadas.
              </div>
            ) : (
              <>
                <div className="mb-1 flex justify-between text-xs text-background/70">
                  <span>Completado</span>
                  <span>{day.pct}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={day.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progreso de hoy ${day.pct}%`}
                  className="h-3 w-full overflow-hidden rounded-full border-[1.5px] border-background bg-transparent"
                >
                  <div
                    className="animate-progress h-full rounded-full bg-background"
                    style={{ width: `${day.pct}%` }}
                  />
                </div>
              </>
            )}
          </div>
          {celebrate ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="animate-confetti absolute h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: areas[i % Math.max(areas.length, 1)]?.color ?? "#fff",
                    ["--tx" as string]: `${(Math.cos((i / 14) * Math.PI * 2) * 120).toFixed(0)}px`,
                    ["--ty" as string]: `${(Math.sin((i / 14) * Math.PI * 2) * 80).toFixed(0)}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          ) : null}
        </section>

        {/* This week */}
        <section className="rounded-2xl border-[1.5px] border-ink bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-text-secondary">Esta semana</div>
              <h2 className="mt-1 text-2xl font-extrabold text-ink">
                {week.total === 0 ? "Semana sin planificar" : "Vas por buen camino"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {week.total === 0
                  ? "Todavía no hay tareas programadas esta semana."
                  : `${week.done} de ${week.total} tareas completadas`}
              </p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-full border-[1.5px] border-ink bg-[var(--area-health)] text-lg font-extrabold text-ink">
              {week.pct}%
            </div>
          </div>
          <div className="mt-5">
            {week.total === 0 ? (
              <EmptyState
                icon={<CalendarClock className="h-6 w-6" />}
                title="Sin planificación semanal"
                description="Programa una tarea para empezar a medir tu progreso."
              />
            ) : (
              <>
                <SegmentedProgressBar segments={weekSegments} />
                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-text-secondary">
                  {week.perDay.map((d) => {
                    const pct = d.total ? Math.round((d.done / d.total) * 100) : 0;
                    return (
                      <div key={d.iso} className="rounded-md border-[1.5px] border-ink bg-white p-1">
                        <div className="capitalize">
                          {new Date(d.iso + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short" })}
                        </div>
                        <div className="text-ink">{d.done}/{d.total}</div>
                        <div className="mt-1 h-1 rounded-full bg-surface-muted">
                          <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-secondary">
            {areas.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-ink"
                  style={{ backgroundColor: a.color ?? undefined }}
                />
                {a.name}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Today segmented */}
      {day.total > 0 ? (
        <section className="mt-6 rounded-2xl border-[1.5px] border-ink bg-white p-6">
          <h2 className="text-xl font-extrabold text-ink">Distribución de hoy por áreas</h2>
          <div className="mt-4">
            <SegmentedProgressBar segments={daySegments} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            {areas.map((a) => {
              const scoped = day.tasks.filter((t) => t.area_id === a.id);
              const done = scoped.filter((t) => t.status === "done").length;
              return (
                <div
                  key={a.id}
                  className="rounded-xl border-[1.5px] border-ink p-2"
                  style={{ backgroundColor: a.color ?? undefined }}
                >
                  <div className="text-[11px] font-semibold text-ink/70">{a.name}</div>
                  <div className="text-sm font-extrabold text-ink">
                    {done}/{scoped.length}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Per project */}
      <section className="mt-6">
        <h2 className="mb-4 text-2xl font-extrabold text-ink">Progreso por proyecto</h2>
        {projects.length === 0 ? (
          <EmptyState
            title="Aún no hay proyectos activos"
            description="Crea un proyecto para empezar a medir su progreso."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {projects.map((p) => {
              const { done, total, pct } = projectLeafProgress(tasks, p.id);
              const a = areas.find((x) => x.id === p.area_id);
              return (
                <Link
                  key={p.id}
                  to="/proyectos/$projectId"
                  params={{ projectId: p.id }}
                  className="press block rounded-2xl border-[1.5px] border-ink bg-white p-5"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        {a?.name ?? "Sin área"}
                      </div>
                      <h3 className="mt-0.5 truncate text-lg font-extrabold text-ink">{p.name}</h3>
                      <div className="mt-1 text-xs text-text-secondary">
                        {total === 0 ? "Sin tareas hoja" : `${done}/${total} hojas completadas`}
                        {p.target_date ? <> · {formatShortDate(p.target_date)}</> : null}
                      </div>
                    </div>
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-sm font-extrabold text-ink"
                      style={{ backgroundColor: a?.color ?? undefined }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <ProgressBar value={pct} color={a?.color ?? undefined} />
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ink">
                    Ver overview <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}

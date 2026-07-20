import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar, SegmentedProgressBar } from "@/components/ProgressBar";
import {
  AREA_LIST,
  AREAS,
  PROJECTS,
  TASKS,
  TODAY_ISO,
  areaBreakdown,
  dayProgress,
  projectProgress,
  weekProgress,
} from "@/lib/mock-data";
import { useTasksVersion } from "@/lib/task-store";
import { Trophy } from "lucide-react";

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
  useTasksVersion();
  const day = dayProgress(TODAY_ISO);
  const week = weekProgress();
  const areas = areaBreakdown();

  const [celebrate, setCelebrate] = useState(false);
  const [prevPct, setPrevPct] = useState(day.pct);
  useEffect(() => {
    if (day.pct >= 100 && prevPct < 100) {
      setCelebrate(true);
      const to = setTimeout(() => setCelebrate(false), 900);
      return () => clearTimeout(to);
    }
    setPrevPct(day.pct);
  }, [day.pct, prevPct]);

  const daySegments = AREA_LIST.map((a) => ({
    color: a.color,
    value: Math.max(
      TASKS.filter((t) => t.areaId === a.id && t.status === "completed" && t.date === TODAY_ISO).length,
      0.001,
    ),
    label: a.name,
  }));

  const weekSegments = AREA_LIST.map((a) => ({
    color: a.color,
    value: Math.max(
      TASKS.filter((t) => t.areaId === a.id && t.status === "completed" && t.date && week.days.includes(t.date))
        .length,
      0.001,
    ),
    label: a.name,
  }));

  return (
    <AppShell>
      <PageHeader
        title="Progreso"
        subtitle="Cómo avanzas hoy, esta semana y por proyecto."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today */}
        <section className="relative overflow-hidden rounded-2xl border-[1.5px] border-ink bg-ink p-6 text-background">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-background/70">Hoy</div>
              <h2 className="mt-1 text-2xl font-extrabold">
                {day.pct >= 100 ? "¡Lo has clavado!" : day.pct >= 60 ? "Casi lo tienes" : "Vamos a por ello"}
              </h2>
              <p className="mt-1 text-sm text-background/80">
                {day.done} de {day.total} tareas completadas
              </p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-full border-[1.5px] border-background text-2xl font-extrabold">
              <Trophy className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-background/70">
              <span>Completado</span>
              <span>{day.pct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full border-[1.5px] border-background bg-transparent">
              <div className="animate-progress h-full rounded-full bg-background" style={{ width: `${day.pct}%` }} />
            </div>
          </div>
          {celebrate ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="animate-confetti absolute h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: AREA_LIST[i % AREA_LIST.length].color,
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
              <h2 className="mt-1 text-2xl font-extrabold text-ink">Vas por buen camino</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {week.done} de {week.total} tareas completadas
              </p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-full border-[1.5px] border-ink bg-[var(--area-health)] text-lg font-extrabold text-ink">
              {week.pct}%
            </div>
          </div>
          <div className="mt-5">
            <SegmentedProgressBar segments={weekSegments} />
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-secondary">
            {AREA_LIST.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-ink" style={{ backgroundColor: a.color }} />
                {a.name}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Today segmented */}
      <section className="mt-6 rounded-2xl border-[1.5px] border-ink bg-white p-6">
        <h2 className="text-xl font-extrabold text-ink">Distribución de hoy por áreas</h2>
        <div className="mt-4">
          <SegmentedProgressBar segments={daySegments} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          {areas.map(({ area, done, total }) => (
            <div key={area.id} className="rounded-xl border-[1.5px] border-ink p-2" style={{ backgroundColor: area.color }}>
              <div className="text-[11px] font-semibold text-ink/70">{area.name}</div>
              <div className="text-sm font-extrabold text-ink">{done}/{total}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Per project */}
      <section className="mt-6">
        <h2 className="mb-4 text-2xl font-extrabold text-ink">Progreso por proyecto</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PROJECTS.map((p) => {
            const pct = projectProgress(p.id);
            const a = AREAS[p.areaId];
            return (
              <div key={p.id} className="rounded-2xl border-[1.5px] border-ink bg-white p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      {a.name}
                    </div>
                    <h3 className="mt-0.5 truncate text-lg font-extrabold text-ink">{p.name}</h3>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-sm font-extrabold text-ink" style={{ backgroundColor: a.color }}>
                    {pct}%
                  </span>
                </div>
                <ProgressBar value={pct} color={a.color} />
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

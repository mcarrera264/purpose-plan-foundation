import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { TaskRow } from "@/components/TaskRow";
import { ProgressBar, SegmentedProgressBar } from "@/components/ProgressBar";
import { CreateMenu } from "@/components/CreateMenu";
import { Plus, ArrowRight } from "lucide-react";
import {
  AREA_LIST,
  AREAS,
  PROJECTS,
  TASKS,
  TODAY_ISO,
  USER,
  dayProgress,
} from "@/lib/mock-data";
import { useTasksVersion } from "@/lib/task-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio · Purpose Plan" },
      { name: "description", content: "Resumen del día, proyectos activos y próximas tareas." },
    ],
  }),
  component: Home,
});

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function Home() {
  useTasksVersion();
  const day = dayProgress(TODAY_ISO);
  const upcoming = TASKS.filter((t) => (t.date === TODAY_ISO || !t.date) && t.status !== "completed")
    .slice(0, 4);

  const segments = AREA_LIST.map((a) => {
    const done = TASKS.filter((t) => t.areaId === a.id && t.status === "completed" && t.date === TODAY_ISO).length;
    return { color: a.color, value: Math.max(done, 0.001), label: a.name };
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow={fmtDate(TODAY_ISO)}
        title={`Hola, ${USER.name} 👋`}
        subtitle="Este es tu resumen de hoy y de lo que viene."
        actions={
          <CreateMenu>
            <button
              type="button"
              className="press inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-4 text-sm font-semibold text-background"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Crear
            </button>
          </CreateMenu>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Progress hero */}
        <section className="lg:col-span-2 rounded-2xl border-[1.5px] border-ink bg-white p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-ink">Progreso de hoy</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {day.done} de {day.total} tareas completadas
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-full border-[1.5px] border-ink bg-[var(--area-career)] text-lg font-extrabold text-ink">
              {day.pct}%
            </div>
          </div>
          <div className="mt-5">
            <SegmentedProgressBar segments={segments} />
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

        {/* Area distribution */}
        <section className="rounded-2xl border-[1.5px] border-ink bg-white p-5 md:p-6">
          <h2 className="text-xl font-extrabold text-ink">Áreas</h2>
          <div className="mt-4 space-y-3">
            {AREA_LIST.map((a) => {
              const total = TASKS.filter((t) => t.areaId === a.id).length;
              const done = TASKS.filter((t) => t.areaId === a.id && t.status === "completed").length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <div key={a.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{a.name}</span>
                    <span className="text-text-secondary">{done}/{total}</span>
                  </div>
                  <ProgressBar value={pct} color={a.color} size="sm" />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Active projects */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-ink">Proyectos activos</h2>
          <Link to="/proyectos" className="press inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PROJECTS.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      {/* Upcoming */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-ink">Próximas tareas</h2>
          <Link to="/tareas" className="press inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {upcoming.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </div>
      </section>

      <div className="sr-only" aria-hidden>
        {AREAS.career.name}
      </div>
    </AppShell>
  );
}

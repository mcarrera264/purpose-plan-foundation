import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProjectGrid } from "@/components/ProjectGrid";
import { TaskRow } from "@/components/TaskRow";
import { ProgressBar, SegmentedProgressBar } from "@/components/ProgressBar";
import { CreateMenu } from "@/components/CreateMenu";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Plus, ArrowRight, FolderKanban } from "lucide-react";
import { useAreas, useProjects, useTasks } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio · Purpose Plan" },
      { name: "description", content: "Resumen del día, proyectos activos y próximas tareas." },
    ],
  }),
  component: Home,
});

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function Home() {
  const { user } = useAuth();
  const { data: areas = [] } = useAreas();
  const { data: projects = [], isLoading: pl } = useProjects({ status: "active" });
  const { data: tasks = [], isLoading: tl } = useTasks();

  const TODAY = todayIso();
  const todayTasks = tasks.filter((t) => t.scheduled_date === TODAY);
  const todayDone = todayTasks.filter((t) => t.status === "done").length;
  const pct = todayTasks.length ? Math.round((todayDone / todayTasks.length) * 100) : 0;
  const upcoming = tasks
    .filter((t) => t.status === "todo" && (!t.scheduled_date || t.scheduled_date >= TODAY))
    .slice(0, 4);

  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? "de nuevo";
  const isEmpty = !pl && !tl && projects.length === 0 && tasks.length === 0;

  const segments = areas.map((a) => {
    const done = tasks.filter((t) => t.area_id === a.id && t.status === "done" && t.scheduled_date === TODAY).length;
    return { color: a.color ?? "#F2F2F2", value: Math.max(done, 0.001), label: a.name };
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        title={`Hola, ${displayName} 👋`}
        subtitle="Este es tu resumen de hoy y de lo que viene."
        actions={
          <CreateMenu>
            <button type="button" className="press inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-4 text-sm font-semibold text-background">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Crear
            </button>
          </CreateMenu>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="Empieza tu Purpose Plan"
          description="Crea tu primer proyecto o añade una tarea rápida para organizar tus objetivos por áreas."
          action={
            <CreateMenu>
              <button className="press inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-5 text-sm font-semibold text-background">
                <Plus className="h-4 w-4" /> Crear
              </button>
            </CreateMenu>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2 rounded-2xl border-[1.5px] border-ink bg-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-ink">Progreso de hoy</h2>
                  <p className="mt-1 text-sm text-text-secondary">{todayDone} de {todayTasks.length} tareas completadas</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-full border-[1.5px] border-ink bg-[var(--area-career)] text-lg font-extrabold text-ink">{pct}%</div>
              </div>
              <div className="mt-5">
                {segments.length > 0 ? <SegmentedProgressBar segments={segments} /> : <ProgressBar value={pct} />}
              </div>
            </section>
            <section className="rounded-2xl border-[1.5px] border-ink bg-white p-5 md:p-6">
              <h2 className="text-xl font-extrabold text-ink">Áreas</h2>
              <div className="mt-4 space-y-3">
                {areas.map((a) => {
                  const total = tasks.filter((t) => t.area_id === a.id).length;
                  const done = tasks.filter((t) => t.area_id === a.id && t.status === "done").length;
                  const p = total ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={a.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-semibold text-ink">{a.name}</span>
                        <span className="text-text-secondary">{done}/{total}</span>
                      </div>
                      <ProgressBar value={p} color={a.color ?? undefined} size="sm" />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-ink">Proyectos activos</h2>
              <Link to="/proyectos" className="press inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {pl ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : projects.length === 0 ? (
              <EmptyState title="Aún no tienes proyectos" description="Crea tu primer proyecto para empezar a organizar tus objetivos." />
            ) : (
              <ProjectGrid
                projects={projects.slice(0, 4)}
                gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
              />

            )}
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-ink">Próximas tareas</h2>
              <Link to="/tareas" className="press inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {tl ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : upcoming.length === 0 ? (
              <EmptyState title="No hay tareas próximas" description="Añade una tarea rápida para empezar." />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {upcoming.map((t) => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}

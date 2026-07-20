import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TaskTree } from "@/components/TaskTree";
import { ProgressBar } from "@/components/ProgressBar";
import { AreaChip, AreaIcon } from "@/components/AreaChip";
import { StatusBadge } from "@/components/StatusBadge";
import { AREAS, PROJECTS, getRootProjectTasks, getTask, projectProgress } from "@/lib/mock-data";
import { useTasksVersion } from "@/lib/task-store";
import { ArrowLeft, Archive, Pencil, Plus, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/proyectos/$projectId")({
  loader: ({ params }) => {
    const project = PROJECTS.find((p) => p.id === params.projectId);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.project.name} · Purpose Plan` : "Proyecto · Purpose Plan" },
      {
        name: "description",
        content: loaderData?.project.description ?? "Detalle de proyecto.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="rounded-2xl border-[1.5px] border-ink bg-white p-6">
        <h1 className="text-xl font-bold text-ink">No se pudo cargar el proyecto</h1>
        <p className="mt-2 text-sm text-text-secondary">{error.message}</p>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="rounded-2xl border-[1.5px] border-ink bg-white p-6">
        <h1 className="text-xl font-bold text-ink">Proyecto no encontrado</h1>
        <Link to="/proyectos" className="mt-4 inline-flex text-sm font-semibold text-ink underline">
          Volver a Proyectos
        </Link>
      </div>
    </AppShell>
  ),
  component: ProjectOverview,
});

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function ProjectOverview() {
  useTasksVersion();
  const { project } = Route.useLoaderData();
  const area = AREAS[project.areaId];
  const rootTasks = getRootProjectTasks(project.id);
  const pct = projectProgress(project.id);
  const activeTask = project.activeTaskId ? getTask(project.activeTaskId) : undefined;

  const doAction = (label: string) => toast(`${label} · próximamente`);

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to="/proyectos"
          className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-3 py-1.5 text-xs font-semibold text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Proyectos
        </Link>
      </div>

      {/* Hero */}
      <section
        className="rounded-3xl border-[1.5px] border-ink p-6 md:p-8"
        style={{ backgroundColor: area.color, viewTransitionName: `project-${project.id}` }}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <AreaChip area={area} />
              <StatusBadge>Activo</StatusBadge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              {project.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink/80 md:text-base">
              {project.description}
            </p>
            <div className="mt-3 text-sm text-ink/70">
              Horizonte: <span className="font-semibold text-ink">{fmtDate(project.targetDate)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => doAction("Editar")} className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-4 py-2 text-sm font-semibold text-ink">
              <Pencil className="h-4 w-4" /> Editar
            </button>
            <button onClick={() => doAction("Añadir tarea")} className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-4 py-2 text-sm font-semibold text-background">
              <Plus className="h-4 w-4" /> Añadir tarea
            </button>
            <button onClick={() => doAction("Archivar")} className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-4 py-2 text-sm font-semibold text-ink">
              <Archive className="h-4 w-4" /> Archivar
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-[1.5px] border-ink bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Progreso</span>
            <span className="text-sm text-text-secondary">{pct}%</span>
          </div>
          <ProgressBar value={pct} />
          {activeTask ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl border-[1.5px] border-ink bg-surface-muted p-3">
              <div className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-ink bg-white">
                <AreaIcon areaId={activeTask.areaId} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">
                  Siguiente tarea
                </div>
                <div className="truncate text-sm font-semibold text-ink">{activeTask.title}</div>
              </div>
              <button
                onClick={() => doAction("Completar")}
                aria-label="Completar tarea"
                className="press grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-ink bg-white"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Tree */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-ink">Tareas</h2>
          <button
            onClick={() => doAction("Añadir tarea")}
            className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-3 py-1.5 text-sm font-semibold text-ink"
          >
            <Plus className="h-4 w-4" /> Añadir
          </button>
        </div>
        <TaskTree tasks={rootTasks} />
      </section>
    </AppShell>
  );
}

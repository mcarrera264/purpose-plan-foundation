import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TaskTree } from "@/components/TaskTree";
import { ProgressBar } from "@/components/ProgressBar";
import { AreaIconByName, areaColor, areaIconName } from "@/lib/area-visuals";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { TaskFormDialog } from "@/components/TaskFormDialog";
import { ProjectFormDialog } from "@/components/ProjectFormDialog";
import { AIPanel } from "@/components/AIPanel";
import {
  useAreas,
  useProject,
  useProjectTasks,
  useToggleTaskStatus,
  useUpdateProject,
  projectProgressPct,
} from "@/lib/data";
import { ArrowLeft, Archive, Pencil, Plus, Check, RotateCcw, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/proyectos/$projectId")({
  head: ({ params }) => ({
    meta: [
      { title: "Proyecto · Purpose Plan" },
      { name: "description", content: `Detalle del proyecto ${params.projectId}` },
    ],
  }),
  component: ProjectOverview,
});

function fmtDate(iso: string | null) {
  if (!iso) return "Sin horizonte";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function ProjectOverview() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const { data: project, isLoading: pl } = useProject(projectId);
  const { data: tasks = [], isLoading: tl } = useProjectTasks(projectId);
  const { data: areas = [] } = useAreas(true);
  const updateProject = useUpdateProject();
  const toggle = useToggleTaskStatus();
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  if (pl) {
    return <AppShell><div className="rounded-2xl border-[1.5px] border-ink bg-white p-6">Cargando…</div></AppShell>;
  }
  if (!project) {
    return (
      <AppShell>
        <div className="rounded-2xl border-[1.5px] border-ink bg-white p-6">
          <h1 className="text-xl font-bold text-ink">Proyecto no encontrado</h1>
          <Link to="/proyectos" className="mt-4 inline-flex text-sm font-semibold text-ink underline">Volver a Proyectos</Link>
        </div>
      </AppShell>
    );
  }

  const area = areas.find((a) => a.id === project.area_id) ?? null;
  const pct = projectProgressPct(tasks, project.id);
  const activeTask = tasks.find((t) => t.status === "todo") ?? null;

  const setStatus = async (status: "active" | "completed" | "archived") => {
    await updateProject.mutateAsync({ id: project.id, status });
    toast.success(status === "active" ? "Proyecto reactivado" : status === "completed" ? "Proyecto completado" : "Proyecto archivado");
    if (status === "archived") navigate({ to: "/proyectos" });
  };

  return (
    <AppShell>
      <div className="mb-4">
        <Link to="/proyectos" className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-3 py-1.5 text-xs font-semibold text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Proyectos
        </Link>
      </div>

      <section className="rounded-3xl border-[1.5px] border-ink p-6 md:p-8" style={{ backgroundColor: areaColor(area), viewTransitionName: `project-${project.id}` }}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-white/70 px-2.5 py-1 text-xs font-semibold text-ink">
                <AreaIconByName name={areaIconName(area)} className="h-3.5 w-3.5" /> {area?.name ?? "Sin área"}
              </span>
              <StatusBadge>{project.status === "active" ? "Activo" : project.status === "completed" ? "Completado" : "Archivado"}</StatusBadge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{project.name}</h1>
            {project.description ? <p className="mt-2 max-w-2xl text-sm text-ink/80 md:text-base">{project.description}</p> : null}
            <div className="mt-3 text-sm text-ink/70">Horizonte: <span className="font-semibold text-ink">{fmtDate(project.target_date)}</span></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setEditOpen(true)} className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-4 py-2 text-sm font-semibold text-ink">
              <Pencil className="h-4 w-4" /> Editar
            </button>
            <button onClick={() => setAddOpen(true)} className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-4 py-2 text-sm font-semibold text-background">
              <Plus className="h-4 w-4" /> Añadir tarea
            </button>
            {project.status === "active" ? (
              <>
                <button onClick={() => setStatus("completed")} className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-4 py-2 text-sm font-semibold text-ink">
                  <CheckCircle2 className="h-4 w-4" /> Completar
                </button>
                <button onClick={() => setConfirmArchive(true)} className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-4 py-2 text-sm font-semibold text-ink">
                  <Archive className="h-4 w-4" /> Archivar
                </button>
              </>
            ) : (
              <button onClick={() => setStatus("active")} className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-4 py-2 text-sm font-semibold text-ink">
                <RotateCcw className="h-4 w-4" /> Restaurar
              </button>
            )}
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
                <AreaIconByName name={areaIconName(area)} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/60">Siguiente tarea</div>
                <div className="truncate text-sm font-semibold text-ink">{activeTask.title}</div>
              </div>
              <button
                onClick={() => toggle.mutate({ id: activeTask.id, next: "done" })}
                aria-label="Completar tarea"
                className="press grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-ink bg-white"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-ink">Tareas</h2>
          <button onClick={() => setAddOpen(true)} className="press inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-white px-3 py-1.5 text-sm font-semibold text-ink">
            <Plus className="h-4 w-4" /> Añadir
          </button>
        </div>
        {tl ? (
          <div className="rounded-2xl border-[1.5px] border-ink bg-white p-6 text-sm text-text-secondary">Cargando tareas…</div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="Este proyecto aún no tiene tareas"
            description="Añade la primera tarea para empezar a avanzar."
            action={
              <button onClick={() => setAddOpen(true)} className="press inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-5 text-sm font-semibold text-background">
                <Plus className="h-4 w-4" /> Añadir tarea
              </button>
            }
          />
        ) : (
          <TaskTree tasks={tasks} projectId={project.id} />
        )}
      </section>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
      <TaskFormDialog open={addOpen} onOpenChange={setAddOpen} initialProjectId={project.id} initialAreaId={project.area_id} />

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archivar este proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              Se ocultará de la vista activa. Podrás restaurarlo más adelante. Sus tareas se conservan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setStatus("archived")}>Archivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

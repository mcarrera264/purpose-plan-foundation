import { useState } from "react";
import { ChevronRight, Plus, MoreVertical, Archive, Pencil, Sparkles } from "lucide-react";
import { TaskRow } from "./TaskRow";
import { taskChildren, useArchiveTask, type TaskRow as Task } from "@/lib/data";
import { TaskFormDialog } from "./TaskFormDialog";
import { AIPanel } from "./AIPanel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function TaskTree({ tasks, projectId }: { tasks: Task[]; projectId: string }) {
  const roots = tasks.filter((t) => t.project_id === projectId && !t.parent_task_id);
  return (
    <div className="flex flex-col gap-2">
      {roots.map((t) => (
        <TaskTreeNode key={t.id} task={t} allTasks={tasks} level={0} />
      ))}
    </div>
  );
}

function TaskTreeNode({ task, allTasks, level }: { task: Task; allTasks: Task[]; level: number }) {
  const children = taskChildren(allTasks, task.id);
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const archive = useArchiveTask();
  const hasChildren = children.length > 0;
  const canAddChild = level < 2;
  const canDecompose = level < 2;

  return (
    <div>
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button
            type="button"
            aria-label={open ? "Contraer" : "Expandir"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="press grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-white"
            style={{ marginLeft: level * 20 }}
          >
            <ChevronRight
              className="h-3.5 w-3.5 transition-transform"
              style={{ transform: open ? "rotate(90deg)" : "none" }}
              strokeWidth={2.5}
            />
          </button>
        ) : (
          <span className="w-7 shrink-0" style={{ marginLeft: level * 20 }} aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <TaskRow task={task} showProject={false} indent={0} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canAddChild ? (
            <button
              type="button"
              onClick={() => setAddingChild(true)}
              aria-label="Añadir subtarea"
              className="press grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-ink bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Acciones" className="press grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-ink bg-white">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
              {canDecompose && (
                <DropdownMenuItem onSelect={() => setAiOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />Desglosar con IA
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={async () => {
                  await archive.mutateAsync({ id: task.id, archived: true });
                  toast.success("Tarea archivada");
                }}
              >
                <Archive className="mr-2 h-4 w-4" />Archivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {hasChildren && open ? (
        <div className="animate-expand mt-2 flex flex-col gap-2">
          {children.map((c) => (
            <TaskTreeNode key={c.id} task={c} allTasks={allTasks} level={level + 1} />
          ))}
        </div>
      ) : null}

      <TaskFormDialog open={editing} onOpenChange={setEditing} task={task} />
      <TaskFormDialog
        open={addingChild}
        onOpenChange={setAddingChild}
        initialParentId={task.id}
        initialProjectId={task.project_id}
        initialAreaId={task.area_id}
      />
    </div>
  );
}

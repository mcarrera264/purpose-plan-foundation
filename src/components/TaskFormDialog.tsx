import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAreas, useCreateTask, useProjects, useUpdateTask, type TaskRow } from "@/lib/data";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  // Preset defaults
  initialProjectId?: string | null;
  initialParentId?: string | null;
  initialAreaId?: string | null;
  // If provided we're editing
  task?: TaskRow | null;
}

export function TaskFormDialog({ open, onOpenChange, initialProjectId, initialParentId, initialAreaId, task }: Props) {
  const { data: areas = [] } = useAreas();
  const { data: projects = [] } = useProjects({ status: "active" });
  const create = useCreateTask();
  const update = useUpdateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setAreaId(task.area_id ?? "");
      setProjectId(task.project_id ?? "");
      setDate(task.scheduled_date ?? "");
      setStartTime(task.scheduled_start ? new Date(task.scheduled_start).toISOString().slice(11, 16) : "");
      setEndTime(task.scheduled_end ? new Date(task.scheduled_end).toISOString().slice(11, 16) : "");
    } else {
      setTitle("");
      setDescription("");
      setAreaId(initialAreaId ?? areas[0]?.id ?? "");
      setProjectId(initialProjectId ?? "");
      setDate("");
      setStartTime("");
      setEndTime("");
    }
    setError(null);
  }, [open, task, initialAreaId, initialProjectId, areas]);

  const isEdit = !!task;
  const saving = create.isPending || update.isPending;

  const toIsoTime = (d: string, t: string) => (d && t ? new Date(`${d}T${t}:00`).toISOString() : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }
    if (!areaId && !initialParentId) {
      setError("Selecciona un área");
      return;
    }
    if (startTime && endTime && startTime > endTime) {
      setError("La hora final no puede ser anterior a la hora inicial");
      return;
    }
    try {
      if (isEdit && task) {
        await update.mutateAsync({
          id: task.id,
          title: title.trim(),
          description: description.trim() || null,
          area_id: areaId || null,
          project_id: task.parent_task_id ? task.project_id : projectId || null,
          scheduled_date: date || null,
          scheduled_start: toIsoTime(date, startTime),
          scheduled_end: toIsoTime(date, endTime),
        });
        toast.success("Tarea actualizada");
      } else {
        await create.mutateAsync({
          title: title.trim(),
          description: description.trim() || null,
          area_id: areaId,
          project_id: initialParentId ? initialProjectId ?? null : projectId || null,
          parent_task_id: initialParentId ?? null,
          scheduled_date: date || null,
          scheduled_start: toIsoTime(date, startTime),
          scheduled_end: toIsoTime(date, endTime),
        });
        toast.success("Tarea creada");
      }
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar la tarea";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarea" : initialParentId ? "Nueva subtarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>Los cambios se guardan en tu cuenta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Título *</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus maxLength={200} />
          </div>

          {!initialParentId ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Área *</Label>
                <Select value={areaId} onValueChange={setAreaId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Proyecto</Label>
                <Select value={projectId || "__none__"} onValueChange={(v) => setProjectId(v === "__none__" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin proyecto</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-date">Fecha</Label>
              <Input id="task-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-start">Inicio</Label>
              <Input id="task-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={!date} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-end">Fin</Label>
              <Input id="task-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!date} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Descripción</Label>
            <Textarea id="task-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} />
          </div>

          {error ? <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">{error}</div> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Guardando…" : isEdit ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

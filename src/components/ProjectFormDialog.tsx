import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAreas, useCreateProject, useUpdateProject, type ProjectRow } from "@/lib/data";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: ProjectRow | null;
  onCreated?: (p: ProjectRow) => void;
}

export function ProjectFormDialog({ open, onOpenChange, project, onCreated }: Props) {
  const { data: areas = [] } = useAreas();
  const create = useCreateProject();
  const update = useUpdateProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState("");
  const [start, setStart] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (project) {
      setName(project.name);
      setDescription(project.description ?? "");
      setAreaId(project.area_id ?? "");
      setStart(project.start_date ?? "");
      setTarget(project.target_date ?? "");
    } else {
      setName("");
      setDescription("");
      setAreaId(areas[0]?.id ?? "");
      setStart("");
      setTarget("");
    }
    setError(null);
  }, [open, project, areas]);

  const saving = create.isPending || update.isPending;
  const isEdit = !!project;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    if (!areaId) { setError("Selecciona un área"); return; }
    if (start && target && start > target) { setError("La fecha objetivo debe ser posterior al inicio"); return; }
    setError(null);
    try {
      if (isEdit && project) {
        await update.mutateAsync({
          id: project.id,
          name: name.trim(),
          description: description.trim() || null,
          area_id: areaId,
          start_date: start || null,
          target_date: target || null,
        });
        toast.success("Proyecto actualizado");
      } else {
        const created = await create.mutateAsync({
          name: name.trim(),
          description: description.trim() || null,
          area_id: areaId,
          start_date: start || null,
          target_date: target || null,
        });
        toast.success("Proyecto creado");
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle>
          <DialogDescription>Los cambios se guardan en tu cuenta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Nombre *</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={140} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Área *</Label>
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {areas.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-start">Inicio</Label>
              <Input id="p-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-target">Objetivo</Label>
              <Input id="p-target" type="date" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Descripción</Label>
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} />
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

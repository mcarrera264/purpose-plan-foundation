import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore, Pencil, Plus } from "lucide-react";
import { useAreas, useArchiveArea, useCreateArea, useUpdateArea, countAreaActiveItems, type AreaRow } from "@/lib/data";
import { AREA_COLOR_SWATCHES, AREA_ICON_OPTIONS, AreaIconByName } from "@/lib/area-visuals";
import { toast } from "sonner";

export function AreaManagerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: areas = [], isLoading } = useAreas(true);
  const create = useCreateArea();
  const update = useUpdateArea();
  const archive = useArchiveArea();

  const [editing, setEditing] = useState<AreaRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<{ area: AreaRow; projects: number; tasks: number } | null>(null);

  useEffect(() => { if (!open) { setEditing(null); setShowForm(false); setConfirmArchive(null); } }, [open]);

  const active = areas.filter((a) => !a.is_archived);
  const archived = areas.filter((a) => a.is_archived);

  const startArchive = async (a: AreaRow) => {
    const counts = await countAreaActiveItems(a.id);
    if (counts.projects === 0 && counts.tasks === 0) {
      await archive.mutateAsync({ id: a.id, archived: true });
      toast.success("Área archivada");
    } else {
      setConfirmArchive({ area: a, ...counts });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Áreas</DialogTitle>
            <DialogDescription>Gestiona tus áreas de vida. Las áreas del sistema no se pueden eliminar.</DialogDescription>
          </DialogHeader>

          {showForm || editing ? (
            <AreaForm
              area={editing}
              onCancel={() => { setShowForm(false); setEditing(null); }}
              onSubmit={async (values) => {
                try {
                  if (editing) {
                    await update.mutateAsync({ id: editing.id, ...values });
                    toast.success("Área actualizada");
                  } else {
                    await create.mutateAsync(values);
                    toast.success("Área creada");
                  }
                  setShowForm(false); setEditing(null);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "No se pudo guardar");
                }
              }}
              saving={create.isPending || update.isPending}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShowForm(true)}><Plus className="mr-1 h-4 w-4" />Nueva área</Button>
              </div>
              {isLoading ? <div className="text-sm text-text-secondary">Cargando…</div> : null}
              <div className="space-y-2">
                {active.map((a) => (
                  <AreaListItem key={a.id} area={a} onEdit={() => setEditing(a)} onArchive={() => startArchive(a)} />
                ))}
              </div>
              {archived.length > 0 ? (
                <div className="pt-2">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Archivadas</div>
                  <div className="space-y-2">
                    {archived.map((a) => (
                      <AreaListItem key={a.id} area={a} onRestore={() => archive.mutate({ id: a.id, archived: false })} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmArchive} onOpenChange={(v) => !v && setConfirmArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar “{confirmArchive?.area.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta área tiene <strong>{confirmArchive?.projects}</strong> proyecto(s) y <strong>{confirmArchive?.tasks}</strong> tarea(s) activos.
              Al archivarla, esos elementos permanecerán pero seguirán vinculados. Puedes restaurarla más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmArchive) return;
              await archive.mutateAsync({ id: confirmArchive.area.id, archived: true });
              toast.success("Área archivada");
              setConfirmArchive(null);
            }}>Archivar de todas formas</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AreaListItem({ area, onEdit, onArchive, onRestore }: { area: AreaRow; onEdit?: () => void; onArchive?: () => void; onRestore?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-ink p-2.5" style={{ backgroundColor: area.color ?? "#F2F2F2" }}>
      <div className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-ink bg-white">
        <AreaIconByName name={area.icon ?? "sparkles"} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-ink">{area.name}</div>
        <div className="text-[11px] text-ink/70">{area.is_system ? "Sistema" : "Personalizada"}</div>
      </div>
      <div className="flex gap-1">
        {onEdit ? <Button size="icon" variant="outline" onClick={onEdit} aria-label="Editar"><Pencil className="h-4 w-4" /></Button> : null}
        {onArchive && !area.is_system ? <Button size="icon" variant="outline" onClick={onArchive} aria-label="Archivar"><Archive className="h-4 w-4" /></Button> : null}
        {onRestore ? <Button size="icon" variant="outline" onClick={onRestore} aria-label="Restaurar"><ArchiveRestore className="h-4 w-4" /></Button> : null}
      </div>
    </div>
  );
}

function AreaForm({ area, onSubmit, onCancel, saving }: {
  area: AreaRow | null;
  onSubmit: (v: { name: string; color: string; icon: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(area?.name ?? "");
  const [color, setColor] = useState(area?.color ?? AREA_COLOR_SWATCHES[0]);
  const [icon, setIcon] = useState(area?.icon ?? "sparkles");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, color, icon }); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="area-name">Nombre *</Label>
        <Input id="area-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {AREA_COLOR_SWATCHES.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={"h-9 w-9 rounded-full border-[1.5px] " + (color === c ? "border-ink ring-2 ring-ink ring-offset-2" : "border-ink/40")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Icono</Label>
        <div className="flex flex-wrap gap-2">
          {AREA_ICON_OPTIONS.map((n) => (
            <button key={n} type="button" onClick={() => setIcon(n)}
              aria-label={n}
              className={"grid h-9 w-9 place-items-center rounded-full border-[1.5px] bg-white " + (icon === n ? "border-ink ring-2 ring-ink ring-offset-2" : "border-ink/40")}
            >
              <AreaIconByName name={n} />
            </button>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : (area ? "Guardar" : "Crear")}</Button>
      </DialogFooter>
    </form>
  );
}

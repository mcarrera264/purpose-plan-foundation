import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FolderPlus, ListPlus, Layers } from "lucide-react";
import { TaskFormDialog } from "./TaskFormDialog";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { AreaManagerDialog } from "./AreaManagerDialog";

export function CreateMenu({ children, defaultProjectId }: { children: ReactNode; defaultProjectId?: string }) {
  const [open, setOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent align="start" sideOffset={12} className="w-64 rounded-2xl border-[1.5px] border-ink bg-white p-2">
          <MenuItem icon={<ListPlus className="h-4 w-4" />} label="Nueva tarea" onClick={() => { setOpen(false); setTaskOpen(true); }} />
          <MenuItem icon={<FolderPlus className="h-4 w-4" />} label="Nuevo proyecto" onClick={() => { setOpen(false); setProjectOpen(true); }} />
          <MenuItem icon={<Layers className="h-4 w-4" />} label="Gestionar áreas" onClick={() => { setOpen(false); setAreasOpen(true); }} />
        </PopoverContent>
      </Popover>

      <TaskFormDialog open={taskOpen} onOpenChange={setTaskOpen} initialProjectId={defaultProjectId ?? null} />
      <ProjectFormDialog open={projectOpen} onOpenChange={setProjectOpen} />
      <AreaManagerDialog open={areasOpen} onOpenChange={setAreasOpen} />
    </>
  );
}

function MenuItem({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="press flex w-full items-center gap-3 rounded-xl border-[1.5px] border-transparent px-3 py-2.5 text-left text-sm font-semibold text-ink hover:border-ink hover:bg-surface-muted">
      <span className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-ink bg-white">{icon}</span>
      {label}
    </button>
  );
}

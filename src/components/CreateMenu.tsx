import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FolderPlus, ListPlus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function CreateMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const onPick = (label: string) => {
    setOpen(false);
    toast(`${label} · próximamente`, {
      description: "Los formularios de creación llegarán en la siguiente fase.",
    });
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={12}
        className="w-64 rounded-2xl border-[1.5px] border-ink bg-white p-2"
      >
        <MenuItem icon={<FolderPlus className="h-4 w-4" />} label="Nuevo proyecto" onClick={() => onPick("Nuevo proyecto")} />
        <MenuItem icon={<ListPlus className="h-4 w-4" />} label="Nueva tarea" onClick={() => onPick("Nueva tarea")} />
        <MenuItem icon={<Sparkles className="h-4 w-4" />} label="Sugerir con IA" onClick={() => onPick("Sugerir con IA")} />
      </PopoverContent>
    </Popover>
  );
}

function MenuItem({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex w-full items-center gap-3 rounded-xl border-[1.5px] border-transparent px-3 py-2.5 text-left text-sm font-semibold text-ink hover:border-ink hover:bg-surface-muted"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-ink bg-white">
        {icon}
      </span>
      {label}
    </button>
  );
}

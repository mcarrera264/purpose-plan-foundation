import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Task } from "@/lib/mock-data";
import { getChildTasks } from "@/lib/mock-data";
import { TaskRow } from "./TaskRow";

export function TaskTree({ tasks, level = 0 }: { tasks: Task[]; level?: number }) {
  if (level > 2) return null;
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <TaskTreeNode key={t.id} task={t} level={level} />
      ))}
    </div>
  );
}

function TaskTreeNode({ task, level }: { task: Task; level: number }) {
  const children = getChildTasks(task.id);
  const [open, setOpen] = useState(true);
  const hasChildren = children.length > 0 && level < 2;

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
      </div>
      {hasChildren && open ? (
        <div className="animate-expand mt-2">
          <TaskTree tasks={children} level={level + 1} />
        </div>
      ) : null}
    </div>
  );
}

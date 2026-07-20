// Progress calculations for Purpose Plan (phase 4).
// Isolated so the formulas can evolve without touching UI.
import type { TaskRow } from "@/lib/data";
import { today, weekBounds } from "@/lib/time";

const isActive = (t: TaskRow) => t.status !== "archived";

/** Leaf-based project progress. Parent tasks add no weight. */
export function projectLeafProgress(tasks: TaskRow[], projectId: string): { done: number; total: number; pct: number } {
  const inProj = tasks.filter((t) => t.project_id === projectId && isActive(t));
  const leaves = inProj.filter((t) => !inProj.some((c) => c.parent_task_id === t.id));
  const total = leaves.length;
  const done = leaves.filter((l) => l.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

/** Daily progress: tasks scheduled for `iso` (default today). Archived excluded. */
export function dayProgress(tasks: TaskRow[], iso: string = today()): { done: number; total: number; pct: number; tasks: TaskRow[] } {
  const scoped = tasks.filter((t) => isActive(t) && t.scheduled_date === iso);
  const total = scoped.length;
  const done = scoped.filter((t) => t.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pct, tasks: scoped };
}

/** Weekly progress: tasks scheduled inside this week (Mon-Sun, local). */
export function weekProgress(tasks: TaskRow[]): {
  done: number;
  total: number;
  pct: number;
  days: string[];
  tasks: TaskRow[];
  perDay: { iso: string; done: number; total: number }[];
} {
  const { days } = weekBounds();
  const set = new Set(days);
  const scoped = tasks.filter((t) => isActive(t) && t.scheduled_date && set.has(t.scheduled_date));
  const total = scoped.length;
  const done = scoped.filter((t) => t.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const perDay = days.map((iso) => {
    const dayTasks = scoped.filter((t) => t.scheduled_date === iso);
    return { iso, total: dayTasks.length, done: dayTasks.filter((t) => t.status === "done").length };
  });
  return { done, total, pct, days, tasks: scoped, perDay };
}

/** Per-area breakdown across a set of tasks. */
export function areaBreakdown(tasks: TaskRow[], areaIds: string[]) {
  return areaIds.map((areaId) => {
    const scoped = tasks.filter((t) => t.area_id === areaId && isActive(t));
    const total = scoped.length;
    const done = scoped.filter((t) => t.status === "done").length;
    return { areaId, done, total };
  });
}

import { useSyncExternalStore } from "react";
import { TASKS, type Task, type TaskStatus } from "./mock-data";

// Lightweight in-memory store to toggle completion locally.
const listeners = new Set<() => void>();
const state: Record<string, TaskStatus> = {};
for (const t of TASKS) state[t.id] = t.status;

function emit() {
  for (const l of listeners) l();
}

export function toggleTask(id: string) {
  const cur = state[id] ?? "pending";
  state[id] = cur === "completed" ? "pending" : "completed";
  // mutate mock so selectors reflect change
  const t = TASKS.find((x) => x.id === id);
  if (t) t.status = state[id];
  emit();
}

export function setTaskStatus(id: string, status: TaskStatus) {
  state[id] = status;
  const t = TASKS.find((x) => x.id === id);
  if (t) t.status = status;
  emit();
}

export function useTaskStatus(id: string): TaskStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state[id] ?? "pending",
    () => state[id] ?? "pending",
  );
}

export function useTasksVersion(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version(),
    () => 0,
  );
}

let v = 0;
function version() {
  return v;
}
const origEmit = emit;
// wrap
(function wrap() {
  const w = () => {
    v++;
    origEmit();
  };
  // replace listener trigger
  (emit as unknown as { call?: unknown }).call = w;
})();

// Re-export for convenience
export type { Task };

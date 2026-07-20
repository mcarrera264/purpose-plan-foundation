import { useSyncExternalStore } from "react";
import { TASKS, type TaskStatus } from "./mock-data";

const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function toggleTask(id: string) {
  const t = TASKS.find((x) => x.id === id);
  if (!t) return;
  t.status = t.status === "completed" ? "pending" : "completed";
  emit();
}

export function setTaskStatus(id: string, status: TaskStatus) {
  const t = TASKS.find((x) => x.id === id);
  if (!t) return;
  t.status = status;
  emit();
}

export function useTaskStatus(id: string): TaskStatus {
  return useSyncExternalStore(
    subscribe,
    () => TASKS.find((t) => t.id === id)?.status ?? "pending",
    () => TASKS.find((t) => t.id === id)?.status ?? "pending",
  );
}

export function useTasksVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
}

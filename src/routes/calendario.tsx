import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { AREAS, TASKS } from "@/lib/mock-data";
import { useTasksVersion, toggleTask } from "@/lib/task-store";
import { ChevronLeft, ChevronRight, Check, Clock } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario · Purpose Plan" },
      { name: "description", content: "Vista semanal de tus tareas planificadas." },
    ],
  }),
  component: CalendarPage,
});

function startOfWeek(d: Date) {
  const nd = new Date(d);
  const day = (nd.getDay() + 6) % 7; // Monday start
  nd.setDate(nd.getDate() - day);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function CalendarPage() {
  useTasksVersion();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string>(iso(new Date()));

  const start = useMemo(() => {
    const s = startOfWeek(new Date());
    s.setDate(s.getDate() + weekOffset * 7);
    return s;
  }, [weekOffset]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [start]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, typeof TASKS> = {};
    for (const d of days) map[iso(d)] = [];
    for (const t of TASKS) {
      if (t.date && map[t.date]) map[t.date].push(t);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
    }
    return map;
  }, [days]);

  const selectedTasks = tasksByDay[selected] ?? [];

  const label = start.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <AppShell>
      <PageHeader
        title="Calendario"
        subtitle="Solo tus tareas de Purpose Plan, coloreadas por área."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((v) => v - 1)}
              aria-label="Semana anterior"
              className="press grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-ink bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="press inline-flex h-11 items-center rounded-full border-[1.5px] border-ink bg-white px-4 text-sm font-semibold text-ink"
            >
              Hoy
            </button>
            <button
              onClick={() => setWeekOffset((v) => v + 1)}
              aria-label="Semana siguiente"
              className="press grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-ink bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="mb-4 text-sm font-semibold capitalize text-text-secondary">{label}</div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Week grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {days.map((d) => {
            const key = iso(d);
            const isSel = key === selected;
            const isToday = key === iso(new Date());
            const list = tasksByDay[key];
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={[
                  "press flex min-h-[140px] flex-col rounded-2xl border-[1.5px] border-ink p-2 text-left transition md:min-h-[220px] md:p-3",
                  isSel ? "bg-ink text-background" : "bg-white text-ink",
                ].join(" ")}
                aria-pressed={isSel}
              >
                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                  <span className={isSel ? "text-background/80" : "text-text-secondary"}>
                    {d.toLocaleDateString("es-ES", { weekday: "short" })}
                  </span>
                  <span
                    className={[
                      "grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold",
                      isToday && !isSel ? "border-[1.5px] border-ink bg-[var(--area-career)] text-ink" : "",
                      isSel ? "bg-background text-ink" : "",
                    ].join(" ")}
                  >
                    {d.getDate()}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  {list.slice(0, 4).map((t) => {
                    const a = AREAS[t.areaId];
                    return (
                      <span
                        key={t.id}
                        className="truncate rounded-md border-[1.5px] border-ink px-1.5 py-0.5 text-[11px] font-semibold text-ink"
                        style={{
                          backgroundColor: t.status === "completed" ? "#fff" : a.color,
                          textDecoration: t.status === "completed" ? "line-through" : undefined,
                          opacity: t.status === "completed" ? 0.7 : 1,
                        }}
                      >
                        {t.time ? `${t.time} · ` : ""}
                        {t.title}
                      </span>
                    );
                  })}
                  {list.length > 4 ? (
                    <span className={`text-[11px] ${isSel ? "text-background/80" : "text-text-secondary"}`}>
                      +{list.length - 4} más
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Day panel */}
        <aside className="rounded-2xl border-[1.5px] border-ink bg-white p-5">
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Día seleccionado
            </div>
            <h2 className="mt-1 text-xl font-extrabold capitalize text-ink">
              {new Date(selected).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
          </div>
          {selectedTasks.length === 0 ? (
            <EmptyState title="Día libre" description="No tienes tareas planificadas." />
          ) : (
            <ul className="space-y-2">
              {selectedTasks.map((t) => {
                const a = AREAS[t.areaId];
                const done = t.status === "completed";
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl border-[1.5px] border-ink p-2"
                    style={{ backgroundColor: done ? "#fff" : a.color, opacity: done ? 0.75 : 1 }}
                  >
                    <button
                      onClick={() => toggleTask(t.id)}
                      aria-label={done ? "Marcar pendiente" : "Marcar completada"}
                      aria-pressed={done}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-white"
                    >
                      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm font-semibold text-ink ${done ? "line-through" : ""}`}>
                        {t.title}
                      </div>
                      <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink/70">
                        <Clock className="h-3 w-3" /> {t.time ?? "Todo el día"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

export type AreaId = "career" | "health" | "finance" | "social";

export interface Area {
  id: AreaId;
  name: string;
  color: string;
  ink: string;
  icon: string;
}

export const AREAS: Record<AreaId, Area> = {
  career: { id: "career", name: "Carrera", color: "var(--area-career)", ink: "var(--area-career-ink)", icon: "briefcase" },
  health: { id: "health", name: "Salud", color: "var(--area-health)", ink: "var(--area-health-ink)", icon: "heart" },
  finance: { id: "finance", name: "Finanzas", color: "var(--area-finance)", ink: "var(--area-finance-ink)", icon: "dollar-sign" },
  social: { id: "social", name: "Social", color: "var(--area-social)", ink: "var(--area-social-ink)", icon: "users" },
};

export const AREA_LIST: Area[] = Object.values(AREAS);

export type TaskStatus = "pending" | "completed" | "overdue";

export interface Task {
  id: string;
  title: string;
  areaId: AreaId;
  projectId?: string;
  parentId?: string;
  date?: string; // ISO
  time?: string; // HH:mm
  status: TaskStatus;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  areaId: AreaId;
  targetDate: string; // ISO
  activeTaskId?: string;
  archived?: boolean;
}

// --- Anchor "today" for deterministic mock data
const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const TODAY_ISO = iso(today);
export const TOMORROW_ISO = addDays(1);

export const PROJECTS: Project[] = [
  {
    id: "p-raise",
    name: "Conseguir un aumento",
    description: "Preparar el caso, pitch y negociación con datos y resultados.",
    areaId: "career",
    targetDate: addDays(24),
    activeTaskId: "t-pitch",
  },
  {
    id: "p-shape",
    name: "Ponerme en forma",
    description: "Retomar rutina progresiva de caminatas, fuerza y seguimiento.",
    areaId: "health",
    targetDate: addDays(60),
    activeTaskId: "t-walk",
  },
  {
    id: "p-car",
    name: "Comprar un coche nuevo",
    description: "Comparar opciones, financiación y cerrar decisión antes de fin de año.",
    areaId: "finance",
    targetDate: addDays(40),
    activeTaskId: "t-budget",
  },
  {
    id: "p-friends",
    name: "Reconectar con amigos",
    description: "Planificar quedadas mensuales y mantener contacto cercano.",
    areaId: "social",
    targetDate: addDays(20),
    activeTaskId: "t-dinner",
  },
];

export const TASKS: Task[] = [
  // --- Career / Raise
  { id: "t-review", title: "Revisar opciones de coche", areaId: "finance", projectId: "p-car", date: addDays(-1), time: "16:30", status: "overdue" },
  { id: "t-pitch", title: "Pitch outline", areaId: "career", projectId: "p-raise", date: TODAY_ISO, time: "14:00", status: "pending" },
  { id: "t-standup", title: "Preparar 1:1 con manager", areaId: "career", projectId: "p-raise", date: TODAY_ISO, time: "10:00", status: "completed" },

  // --- Health / Shape (with tree)
  { id: "t-walk", title: "Preparar caminatas", areaId: "health", projectId: "p-shape", date: TODAY_ISO, time: "18:00", status: "pending" },
  { id: "t-walk-shoes", title: "Elegir zapatillas cómodas", areaId: "health", projectId: "p-shape", parentId: "t-walk", status: "completed" },
  { id: "t-walk-route", title: "Elegir ruta segura y cercana", areaId: "health", projectId: "p-shape", parentId: "t-walk", date: TOMORROW_ISO, time: "10:00", status: "pending" },
  { id: "t-walk-route-map", title: "Marcar puntos de descanso", areaId: "health", projectId: "p-shape", parentId: "t-walk-route", status: "pending" },
  { id: "t-basics", title: "Aprender básicos de ejercicio", areaId: "health", projectId: "p-shape", date: addDays(5), status: "pending" },
  { id: "t-track", title: "Registrar repeticiones", areaId: "health", projectId: "p-shape", date: addDays(12), status: "pending" },

  // --- Finance / Car
  { id: "t-budget", title: "Definir presupuesto", areaId: "finance", projectId: "p-car", date: TOMORROW_ISO, time: "10:00", status: "pending" },
  { id: "t-market", title: "Comparar precios de mercado", areaId: "finance", projectId: "p-car", date: TOMORROW_ISO, time: "15:00", status: "pending" },
  { id: "t-loan", title: "Confirmar opciones de préstamo", areaId: "finance", projectId: "p-car", date: addDays(3), time: "13:00", status: "pending" },

  // --- Social
  { id: "t-dinner", title: "Cena con amigos del cole", areaId: "social", date: addDays(2), time: "20:30", projectId: "p-friends", status: "pending" },
  { id: "t-call", title: "Llamar a Marta", areaId: "social", status: "pending" }, // unscheduled

  // --- Standalone
  { id: "t-water", title: "Beber 2L de agua", areaId: "health", date: TODAY_ISO, status: "completed" },
  { id: "t-finalize", title: "Finalizar presentación", areaId: "career", date: TOMORROW_ISO, time: "17:30", status: "pending" },
  { id: "t-practice", title: "Ensayar presentación", areaId: "career", date: addDays(4), time: "11:00", status: "pending" },
];

export const USER = {
  name: "Rodrigo",
  initials: "R",
};

// --- Selectors
export const getArea = (id: AreaId) => AREAS[id];
export const getProject = (id: string) => PROJECTS.find((p) => p.id === id);
export const getTask = (id: string) => TASKS.find((t) => t.id === id);
export const getProjectTasks = (projectId: string) =>
  TASKS.filter((t) => t.projectId === projectId);
export const getRootProjectTasks = (projectId: string) =>
  TASKS.filter((t) => t.projectId === projectId && !t.parentId);
export const getChildTasks = (parentId: string) =>
  TASKS.filter((t) => t.parentId === parentId);

export const projectProgress = (projectId: string) => {
  const tasks = getProjectTasks(projectId);
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "completed").length;
  return Math.round((done / tasks.length) * 100);
};

export const dayProgress = (dateIso: string) => {
  const list = TASKS.filter((t) => t.date === dateIso);
  const done = list.filter((t) => t.status === "completed").length;
  return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
};

export const weekProgress = () => {
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay());
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(iso(d));
  }
  const list = TASKS.filter((t) => t.date && days.includes(t.date));
  const done = list.filter((t) => t.status === "completed").length;
  return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0, days };
};

export const areaBreakdown = () => {
  return AREA_LIST.map((a) => {
    const list = TASKS.filter((t) => t.areaId === a.id);
    const done = list.filter((t) => t.status === "completed").length;
    return { area: a, done, total: list.length };
  });
};

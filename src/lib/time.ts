// Centralized date/time helpers for Purpose Plan.
// All comparisons on scheduled_date use YYYY-MM-DD strings in the user's local timezone.
// Week starts on Monday (provisional decision, phase 4).

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return isoDate(new Date());
}

export function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

/** Monday-start week bounds for the week containing `ref` (default today). */
export function weekBounds(ref: Date = new Date()): { start: Date; end: Date; startIso: string; endIso: string; days: string[] } {
  const start = new Date(ref);
  const dow = (start.getDay() + 6) % 7; // 0 = Monday
  start.setDate(start.getDate() - dow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(isoDate(d));
  }
  return { start, end, startIso: isoDate(start), endIso: isoDate(end), days };
}

export function isOverdue(scheduledDate: string | null, status: string): boolean {
  if (!scheduledDate) return false;
  if (status === "done" || status === "archived") return false;
  return scheduledDate < today();
}

export function formatDayLabel(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/** Extract HH:MM from a timestamptz (local time). */
export function formatHm(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Convert a YYYY-MM-DD + HH:MM (local) to an ISO timestamptz string, or null. */
export function localToIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  return new Date(`${date}T${time}:00`).toISOString();
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// Next-action dates are day-precise: "YYYY-MM-DD" in the app, stored as noon UTC in next_action_at.

// TODO: "today" is computed in Swiss time even when the owner is abroad
const APP_TIMEZONE = "Europe/Zurich";

export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(dateISO: string, days: number): string {
  const date = new Date(`${dateISO}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function toTimestamp(dateISO: string | null): string | null {
  return dateISO ? `${dateISO}T12:00:00Z` : null;
}

export function toDateISO(timestamp: string | null): string | null {
  return timestamp ? timestamp.slice(0, 10) : null;
}

export function formatDate(dateISO: string | null): string {
  if (!dateISO) return "";
  return new Intl.DateTimeFormat("fr-CH", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateISO}T12:00:00Z`));
}

export function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat("fr-CH", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export type DueTone = "overdue" | "today" | "tomorrow" | "week" | "later" | "completed" | "none";

export interface DueMeta {
  label: string;
  tone: DueTone;
  dateKey: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function extractDateKey(isoOrDate?: string | null): string | null {
  if (!isoOrDate) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(isoOrDate.trim());
  if (match) return match[1];
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return toDateKey(parsed);
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDaysToKey(baseKey: string, days: number): string {
  const date = parseDateKey(baseKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function diffDaysKeys(targetKey: string, baseKey: string): number {
  const a = parseDateKey(targetKey).getTime();
  const b = parseDateKey(baseKey).getTime();
  return Math.round((a - b) / 86_400_000);
}

export function getTodayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function getTomorrowKey(now: Date = new Date()): string {
  return addDaysToKey(toDateKey(now), 1);
}

export function getNextWeekKey(now: Date = new Date()): string {
  return addDaysToKey(toDateKey(now), 7);
}

export function isOverdueDate(dueDate?: string | null, completed = false, now: Date = new Date()): boolean {
  if (completed) return false;
  const key = extractDateKey(dueDate);
  if (!key) return false;
  return key < getTodayKey(now);
}

export function isDueTodayDate(dueDate?: string | null, now: Date = new Date()): boolean {
  const key = extractDateKey(dueDate);
  return key === getTodayKey(now);
}

export function formatShortDate(dateKey: string, referenceNow: Date = new Date()): string {
  const date = parseDateKey(dateKey);
  const sameYear = date.getFullYear() === referenceNow.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function getRelativeDueMeta(
  dueDate?: string | null,
  completed = false,
  now: Date = new Date()
): DueMeta | null {
  const dateKey = extractDateKey(dueDate);
  if (!dateKey) return null;

  const today = getTodayKey(now);
  const diff = diffDaysKeys(dateKey, today);

  if (completed) {
    return {
      label: diff === 0 ? "Today" : formatShortDate(dateKey, now),
      tone: "completed",
      dateKey,
    };
  }

  if (diff < 0) {
    const daysAgo = Math.abs(diff);
    return {
      label: daysAgo <= 7 ? `${daysAgo}d overdue` : formatShortDate(dateKey, now),
      tone: "overdue",
      dateKey,
    };
  }

  if (diff === 0) return { label: "Today", tone: "today", dateKey };
  if (diff === 1) return { label: "Tomorrow", tone: "tomorrow", dateKey };

  if (diff <= 7) {
    const weekday = parseDateKey(dateKey).toLocaleDateString(undefined, { weekday: "short" });
    return { label: weekday, tone: "week", dateKey };
  }

  return { label: formatShortDate(dateKey, now), tone: "later", dateKey };
}

export function formatFullDateHeading(now: Date = new Date()): string {
  return now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTimestamp(isoString: string, now: Date = new Date()): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDetailedTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

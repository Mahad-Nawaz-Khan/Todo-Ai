import { addDaysToKey, getTodayKey, getTomorrowKey } from "@/lib/dates";
import type { Priority, RecurrenceValue } from "@/types/task";

export interface ParsedQuickAdd {
  cleanTitle: string;
  dueDate: string | null;
  priority: Priority | null;
  recurrence: RecurrenceValue | null;
  tagNames: string[];
}

const WEEKDAY_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const PRIORITY_MAP: Record<string, Priority> = {
  "!high": "HIGH",
  "!h": "HIGH",
  "!med": "MEDIUM",
  "!medium": "MEDIUM",
  "!m": "MEDIUM",
  "!low": "LOW",
  "!l": "LOW",
};

const RECURRENCE_PHRASES: Array<[string, RecurrenceValue]> = [
  ["every day", "DAILY"],
  ["every week", "WEEKLY"],
  ["every month", "MONTHLY"],
  ["daily", "DAILY"],
  ["weekly", "WEEKLY"],
  ["monthly", "MONTHLY"],
];

function nextWeekdayKey(targetDay: number, now: Date): string {
  const currentDay = now.getDay();
  const delta = (targetDay - currentDay + 7) % 7 || 7;
  return addDaysToKey(getTodayKey(now), delta);
}

function stripPhrase(input: string, phrase: string): { text: string; matched: boolean } {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|\\s)${escaped}(?=\\s|$)`, "i");
  if (!pattern.test(input)) return { text: input, matched: false };
  return { text: input.replace(pattern, " "), matched: true };
}

function extractRecurrence(raw: string): { working: string; recurrence: RecurrenceValue | null } {
  for (const [phrase, rule] of RECURRENCE_PHRASES) {
    const res = stripPhrase(raw, phrase);
    if (res.matched) {
      return { working: res.text, recurrence: rule };
    }
  }
  return { working: raw, recurrence: null };
}

function parseTagToken(token: string): string | null {
  if (!token.startsWith("#") || token.length <= 1) {
    return null;
  }
  const name = token.slice(1).replace(/[^\w-]/g, "");
  return name || null;
}

function parseDueDateToken(lower: string, now: Date): string | null {
  if (lower === "today") {
    return getTodayKey(now);
  }
  if (lower === "tomorrow" || lower === "tmrw") {
    return getTomorrowKey(now);
  }
  const weekday = WEEKDAY_MAP[lower];
  return weekday === undefined ? null : nextWeekdayKey(weekday, now);
}

export function parseQuickAddText(raw: string, now: Date = new Date()): ParsedQuickAdd {
  const { working, recurrence } = extractRecurrence(raw);
  let dueDate: string | null = null;
  let priority: Priority | null = null;
  const tagNames: string[] = [];

  const tokens = working.trim().split(/\s+/).filter(Boolean);
  const keptTokens: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();

    if (!priority && PRIORITY_MAP[lower]) {
      priority = PRIORITY_MAP[lower];
      continue;
    }

    const tagName = parseTagToken(token);
    if (tagName) {
      tagNames.push(tagName);
      continue;
    }

    if (!dueDate) {
      const parsedDate = parseDueDateToken(lower, now);
      if (parsedDate) {
        dueDate = parsedDate;
        continue;
      }
    }

    keptTokens.push(token);
  }

  return {
    cleanTitle: keptTokens.join(" ").replace(/\s+/g, " ").trim(),
    dueDate,
    priority,
    recurrence,
    tagNames,
  };
}

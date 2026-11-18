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

export function parseQuickAddText(raw: string, now: Date = new Date()): ParsedQuickAdd {
  let working = raw;
  let dueDate: string | null = null;
  let priority: Priority | null = null;
  let recurrence: RecurrenceValue | null = null;
  const tagNames: string[] = [];

  for (const [phrase, rule] of RECURRENCE_PHRASES) {
    const res = stripPhrase(working, phrase);
    if (res.matched) {
      working = res.text;
      recurrence = rule;
      break;
    }
  }

  const tokens = working.trim().split(/\s+/).filter(Boolean);
  const keptTokens: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();

    if (!priority && PRIORITY_MAP[lower]) {
      priority = PRIORITY_MAP[lower];
      continue;
    }

    if (lower.startsWith("#") && token.length > 1) {
      const name = token.slice(1).replace(/[^\w-]/g, "");
      if (name) {
        tagNames.push(name);
        continue;
      }
    }

    if (!dueDate && lower === "today") {
      dueDate = getTodayKey(now);
      continue;
    }

    if (!dueDate && (lower === "tomorrow" || lower === "tmrw")) {
      dueDate = getTomorrowKey(now);
      continue;
    }

    if (!dueDate && WEEKDAY_MAP[lower] !== undefined) {
      dueDate = nextWeekdayKey(WEEKDAY_MAP[lower], now);
      continue;
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

import { describe, expect, it } from "vitest";

import {
  extractDateKey,
  getRelativeDueMeta,
  isDueTodayDate,
  isOverdueDate,
} from "@/lib/dates";

describe("dates utilities", () => {
  const refNow = new Date(2026, 10, 18, 23, 45, 0); // Nov 18, 2026 11:45 PM local

  it("extracts calendar YYYY-MM-DD cleanly from ISO datetimes", () => {
    expect(extractDateKey("2026-11-18T00:00:00Z")).toBe("2026-11-18");
    expect(extractDateKey("2026-11-20")).toBe("2026-11-20");
    expect(extractDateKey(null)).toBeNull();
  });

  it("treats today's date as due today even late at night, not overdue", () => {
    expect(isDueTodayDate("2026-11-18T00:00:00", refNow)).toBe(true);
    expect(isOverdueDate("2026-11-18T00:00:00", false, refNow)).toBe(false);
    expect(isOverdueDate("2026-11-17T00:00:00", false, refNow)).toBe(true);
    expect(isOverdueDate("2026-11-17T00:00:00", true, refNow)).toBe(false);
  });

  it("produces semantic relative due labels and tones", () => {
    expect(getRelativeDueMeta("2026-11-16", false, refNow)).toEqual({
      label: "2d overdue",
      tone: "overdue",
      dateKey: "2026-11-16",
    });
    expect(getRelativeDueMeta("2026-11-18", false, refNow)).toEqual({
      label: "Today",
      tone: "today",
      dateKey: "2026-11-18",
    });
    expect(getRelativeDueMeta("2026-11-19", false, refNow)).toEqual({
      label: "Tomorrow",
      tone: "tomorrow",
      dateKey: "2026-11-19",
    });
    expect(getRelativeDueMeta("2026-11-16", true, refNow)?.tone).toBe("completed");
  });
});

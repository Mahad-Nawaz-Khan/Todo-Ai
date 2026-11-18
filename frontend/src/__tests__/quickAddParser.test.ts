import { describe, expect, it } from "vitest";

import { parseQuickAddText } from "@/lib/quickAddParser";

describe("parseQuickAddText", () => {
  const refNow = new Date(2026, 10, 18, 9, 0, 0); // Wed Nov 18, 2026

  it("extracts date, priority, recurrence, and tags cleanly", () => {
    const parsed = parseQuickAddText(
      "Submit AI assignment tomorrow !high #uni every week",
      refNow
    );
    expect(parsed).toEqual({
      cleanTitle: "Submit AI assignment",
      dueDate: "2026-11-19",
      priority: "HIGH",
      recurrence: "WEEKLY",
      tagNames: ["uni"],
    });
  });

  it("resolves weekday tokens to the next matching day", () => {
    const parsed = parseQuickAddText("Call dentist fri !med", refNow);
    expect(parsed.cleanTitle).toBe("Call dentist");
    expect(parsed.dueDate).toBe("2026-11-20");
    expect(parsed.priority).toBe("MEDIUM");
  });
});

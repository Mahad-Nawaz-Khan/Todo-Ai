import { describe, expect, it } from "vitest";

import {
  computeSidebarCounts,
  selectAllTasks,
  selectCompletedGroups,
  selectToday,
  selectUpcomingGroups,
} from "@/lib/taskViews";
import type { Task } from "@/types/task";

const NOW = new Date(2026, 10, 18, 12, 0, 0); // Wed Nov 18, 2026

function makeTask(overrides: Partial<Task> & { id: number; title: string }): Task {
  return {
    description: null,
    completed: false,
    priority: "MEDIUM",
    due_date: null,
    recurrence_rule: null,
    created_at: "2026-11-18T08:00:00Z",
    updated_at: "2026-11-18T08:00:00Z",
    tags: [],
    ...overrides,
  };
}

const sampleTasks: Task[] = [
  makeTask({ id: 1, title: "Overdue task", due_date: "2026-11-16", priority: "HIGH" }),
  makeTask({ id: 2, title: "Today open", due_date: "2026-11-18", priority: "MEDIUM" }),
  makeTask({ id: 3, title: "Today done", due_date: "2026-11-18", completed: true, updated_at: "2026-11-18T10:00:00Z" }),
  makeTask({ id: 4, title: "Tomorrow task", due_date: "2026-11-19", priority: "LOW" }),
  makeTask({ id: 5, title: "No date task", due_date: null, priority: "HIGH", tags: [{ id: 10, name: "work", color: "#1D4ED8" }] }),
];

describe("taskViews selectors", () => {
  it("Today includes overdue + due today incomplete, excludes unscheduled", () => {
    const res = selectToday(sampleTasks, {}, NOW);
    expect(res.overdueCount).toBe(1);
    expect(res.completedTodayCount).toBe(1);
    expect(res.totalTodayScope).toBe(3);
    expect(res.groups.map((g) => g.label)).toEqual(["Overdue", "Today"]);
    expect(res.groups[0].tasks.map((t) => t.id)).toEqual([1]);
    expect(res.groups[1].tasks.map((t) => t.id)).toEqual([2]);
  });

  it("Upcoming groups future tasks by day with Tomorrow prefix", () => {
    const groups = selectUpcomingGroups(sampleTasks, {}, NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toContain("Tomorrow");
    expect(groups[0].tasks.map((t) => t.id)).toEqual([4]);
  });

  it("All tasks filters by priority and search across tags", () => {
    const res = selectAllTasks(
      sampleTasks,
      {
        status: "open",
        priority: "HIGH",
        search: "work",
        sortBy: "priority",
        order: "desc",
        groupBy: "priority",
        showCompleted: false,
      },
      NOW
    );
    expect(res.matchCount).toBe(1);
    expect(res.groups[0].tasks[0].id).toBe(5);
  });

  it("Completed groups tasks by Today / Yesterday / Older", () => {
    const groups = selectCompletedGroups(sampleTasks, NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Today");
    expect(groups[0].tasks.map((t) => t.id)).toEqual([3]);
  });

  it("computes accurate sidebar counts", () => {
    const counts = computeSidebarCounts(sampleTasks, NOW);
    expect(counts).toEqual({
      today: 2,
      overdue: 1,
      upcoming: 1,
      allOpen: 4,
      completed: 1,
      byTag: { 10: 1 },
    });
  });
});

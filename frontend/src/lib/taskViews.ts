import type { Priority, Task } from "@/types/task";

import {
  addDaysToKey,
  diffDaysKeys,
  extractDateKey,
  getTodayKey,
  isOverdueDate,
  parseDateKey,
} from "./dates";

export type TaskSortField = "created_at" | "updated_at" | "due_date" | "priority";
export type TaskSortOrder = "asc" | "desc";
export type TaskGroupMode = "priority" | "due_date" | "tag" | "none";

export interface TaskGroupBucket {
  key: string;
  label: string;
  tone?: "danger" | "accent" | "default";
  tasks: Task[];
}

export interface AllTasksFilter {
  status: "all" | "open" | "done";
  priority: "" | Priority;
  search: string;
  sortBy: TaskSortField;
  order: TaskSortOrder;
  groupBy: TaskGroupMode;
  showCompleted: boolean;
}

const PRIORITY_RANK: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function sortTasks(tasks: Task[], sortBy: TaskSortField, order: TaskSortOrder): Task[] {
  const direction = order === "asc" ? 1 : -1;

  return [...tasks].sort((a, b) => {
    if (sortBy === "priority") {
      return ((PRIORITY_RANK[a.priority] ?? 0) - (PRIORITY_RANK[b.priority] ?? 0)) * direction;
    }

    if (sortBy === "due_date") {
      const aKey = extractDateKey(a.due_date);
      const bKey = extractDateKey(b.due_date);
      if (!aKey && !bKey) return 0;
      if (!aKey) return 1;
      if (!bKey) return -1;
      return aKey.localeCompare(bKey) * direction;
    }

    const aTime = a[sortBy] ? Date.parse(a[sortBy]) : 0;
    const bTime = b[sortBy] ? Date.parse(b[sortBy]) : 0;
    return (aTime - bTime) * direction;
  });
}

export function groupTasksByPriority(tasks: Task[]): TaskGroupBucket[] {
  const buckets: Record<Priority, Task[]> = { HIGH: [], MEDIUM: [], LOW: [] };
  for (const task of tasks) {
    const level: Priority = task.priority ?? "MEDIUM";
    buckets[level].push(task);
  }

  const order: Array<{ key: Priority; label: string }> = [
    { key: "HIGH", label: "High" },
    { key: "MEDIUM", label: "Medium" },
    { key: "LOW", label: "Low" },
  ];

  return order
    .filter((entry) => buckets[entry.key].length > 0)
    .map((entry) => ({
      key: `priority-${entry.key}`,
      label: entry.label,
      tone: "default" as const,
      tasks: buckets[entry.key],
    }));
}

function groupTasksByDueDate(tasks: Task[], now: Date): TaskGroupBucket[] {
  const todayKey = getTodayKey(now);
  const buckets: Record<string, Task[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    unscheduled: [],
  };

  for (const task of tasks) {
    const key = extractDateKey(task.due_date);
    if (!key) {
      buckets.unscheduled.push(task);
    } else if (key < todayKey && !task.completed) {
      buckets.overdue.push(task);
    } else if (key === todayKey) {
      buckets.today.push(task);
    } else {
      buckets.upcoming.push(task);
    }
  }

  const defs: Array<{ key: keyof typeof buckets; label: string; tone: TaskGroupBucket["tone"] }> = [
    { key: "overdue", label: "Overdue", tone: "danger" },
    { key: "today", label: "Today", tone: "accent" },
    { key: "upcoming", label: "Upcoming", tone: "default" },
    { key: "unscheduled", label: "No due date", tone: "default" },
  ];

  return defs
    .filter((d) => buckets[d.key].length > 0)
    .map((d) => ({
      key: `due-${d.key}`,
      label: d.label,
      tone: d.tone,
      tasks: buckets[d.key],
    }));
}

function groupTasksByTag(tasks: Task[]): TaskGroupBucket[] {
  const map = new Map<string, TaskGroupBucket>();
  const untagged: Task[] = [];

  for (const task of tasks) {
    const primaryTag = task.tags?.[0];
    if (!primaryTag) {
      untagged.push(task);
      continue;
    }
    const existing = map.get(String(primaryTag.id));
    if (existing) {
      existing.tasks.push(task);
    } else {
      map.set(String(primaryTag.id), {
        key: `tag-${primaryTag.id}`,
        label: `#${primaryTag.name}`,
        tone: "default",
        tasks: [task],
      });
    }
  }

  const result = Array.from(map.values());
  if (untagged.length > 0) {
    result.push({ key: "tag-none", label: "Untagged", tone: "default", tasks: untagged });
  }
  return result;
}

export function groupTasks(
  tasks: Task[],
  mode: TaskGroupMode,
  now: Date = new Date()
): TaskGroupBucket[] {
  if (mode === "none") {
    return tasks.length ? [{ key: "all", label: "Tasks", tone: "default", tasks }] : [];
  }
  if (mode === "due_date") return groupTasksByDueDate(tasks, now);
  if (mode === "tag") return groupTasksByTag(tasks);
  return groupTasksByPriority(tasks);
}

export interface TodaySelection {
  groups: TaskGroupBucket[];
  totalTodayScope: number;
  completedTodayCount: number;
  overdueCount: number;
}

export function selectToday(
  tasks: Task[],
  options: { showCompleted?: boolean; sortBy?: TaskSortField; order?: TaskSortOrder } = {},
  now: Date = new Date()
): TodaySelection {
  const todayKey = getTodayKey(now);
  const { showCompleted = false, sortBy = "priority", order = "desc" } = options;

  const overdue: Task[] = [];
  const todayTasks: Task[] = [];
  let completedTodayCount = 0;

  for (const task of tasks) {
    const dueKey = extractDateKey(task.due_date);
    const updatedKey = extractDateKey(task.updated_at);

    if (task.completed) {
      if (dueKey === todayKey || updatedKey === todayKey) {
        completedTodayCount += 1;
        if (showCompleted) {
          todayTasks.push(task);
        }
      }
      continue;
    }

    if (dueKey && dueKey < todayKey) {
      overdue.push(task);
    } else if (dueKey === todayKey) {
      todayTasks.push(task);
    }
  }

  const sortedOverdue = sortTasks(overdue, sortBy, order);
  const sortedToday = sortTasks(todayTasks, sortBy, order);

  const groups: TaskGroupBucket[] = [];
  if (sortedOverdue.length > 0) {
    groups.push({ key: "today-overdue", label: "Overdue", tone: "danger", tasks: sortedOverdue });
  }
  if (sortedToday.length > 0) {
    groups.push({ key: "today-due", label: "Today", tone: "default", tasks: sortedToday });
  }

  const activeTodayCount = overdue.length + todayTasks.filter((t) => !t.completed).length;

  return {
    groups,
    totalTodayScope: activeTodayCount + completedTodayCount,
    completedTodayCount,
    overdueCount: overdue.length,
  };
}

export function selectUpcomingGroups(
  tasks: Task[],
  options: { showCompleted?: boolean; sortBy?: TaskSortField; order?: TaskSortOrder } = {},
  now: Date = new Date()
): TaskGroupBucket[] {
  const todayKey = getTodayKey(now);
  const tomorrowKey = addDaysToKey(todayKey, 1);
  const horizonKey = addDaysToKey(todayKey, 7);
  const { showCompleted = false, sortBy = "due_date", order = "asc" } = options;

  const filtered = tasks.filter((task) => {
    if (!showCompleted && task.completed) return false;
    const dueKey = extractDateKey(task.due_date);
    return Boolean(dueKey && dueKey > todayKey);
  });

  const sorted = sortTasks(filtered, sortBy, order);
  const dayBuckets = new Map<string, TaskGroupBucket>();
  const laterBuckets = new Map<string, TaskGroupBucket>();

  for (const task of sorted) {
    const dueKey = extractDateKey(task.due_date);
    if (!dueKey) continue;

    if (dueKey <= horizonKey) {
      const existing = dayBuckets.get(dueKey);
      if (existing) {
        existing.tasks.push(task);
      } else {
        const dateObj = parseDateKey(dueKey);
        const dayText = dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        const label = dueKey === tomorrowKey ? `Tomorrow · ${dayText}` : dayText;
        dayBuckets.set(dueKey, { key: `up-${dueKey}`, label, tone: "default", tasks: [task] });
      }
      continue;
    }

    const monthKey = dueKey.slice(0, 7);
    const existingMonth = laterBuckets.get(monthKey);
    if (existingMonth) {
      existingMonth.tasks.push(task);
    } else {
      const monthLabel = parseDateKey(dueKey).toLocaleDateString(undefined, { month: "long", year: "numeric" });
      laterBuckets.set(monthKey, { key: `later-${monthKey}`, label: monthLabel, tone: "default", tasks: [task] });
    }
  }

  const orderedDays = Array.from(dayBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) => bucket);

  const orderedLater = Array.from(laterBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) => bucket);

  return [...orderedDays, ...orderedLater];
}

export function selectAllTasks(
  tasks: Task[],
  filters: AllTasksFilter,
  now: Date = new Date()
): { groups: TaskGroupBucket[]; matchCount: number } {
  let result = tasks;

  if (filters.status === "open") {
    result = result.filter((t) => !t.completed);
  } else if (filters.status === "done") {
    result = result.filter((t) => t.completed);
  } else if (!filters.showCompleted) {
    result = result.filter((t) => !t.completed);
  }

  if (filters.priority) {
    result = result.filter((t) => t.priority === filters.priority);
  }

  const q = filters.search.trim().toLowerCase();
  if (q) {
    result = result.filter((t) => {
      const tagText = (t.tags ?? []).map((tag) => tag.name).join(" ");
      return `${t.title} ${t.description ?? ""} ${tagText}`.toLowerCase().includes(q);
    });
  }

  const sorted = sortTasks(result, filters.sortBy, filters.order);
  return {
    groups: groupTasks(sorted, filters.groupBy, now),
    matchCount: sorted.length,
  };
}

export function selectCompletedGroups(tasks: Task[], now: Date = new Date()): TaskGroupBucket[] {
  const todayKey = getTodayKey(now);
  const completed = sortTasks(
    tasks.filter((t) => t.completed),
    "updated_at",
    "desc"
  );

  const buckets: Record<"today" | "yesterday" | "week" | "older", Task[]> = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };

  for (const task of completed) {
    const key = extractDateKey(task.updated_at);
    if (!key) {
      buckets.older.push(task);
      continue;
    }
    const diff = diffDaysKeys(todayKey, key);
    if (diff === 0) buckets.today.push(task);
    else if (diff === 1) buckets.yesterday.push(task);
    else if (diff <= 7) buckets.week.push(task);
    else buckets.older.push(task);
  }

  const defs: Array<{ key: keyof typeof buckets; label: string }> = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "This week" },
    { key: "older", label: "Older" },
  ];

  return defs
    .filter((d) => buckets[d.key].length > 0)
    .map((d) => ({ key: `done-${d.key}`, label: d.label, tone: "default", tasks: buckets[d.key] }));
}

export function selectByTag(
  tasks: Task[],
  tagId: number,
  options: { showCompleted?: boolean; sortBy?: TaskSortField; order?: TaskSortOrder; groupBy?: TaskGroupMode } = {},
  now: Date = new Date()
): { groups: TaskGroupBucket[]; matchCount: number } {
  const { showCompleted = false, sortBy = "priority", order = "desc", groupBy = "priority" } = options;

  const filtered = tasks.filter((task) => {
    if (!showCompleted && task.completed) return false;
    return (task.tags ?? []).some((tag) => tag.id === tagId);
  });

  const sorted = sortTasks(filtered, sortBy, order);
  return {
    groups: groupTasks(sorted, groupBy, now),
    matchCount: sorted.length,
  };
}

export interface SidebarCounts {
  today: number;
  overdue: number;
  upcoming: number;
  allOpen: number;
  completed: number;
  byTag: Record<number, number>;
}

export function computeSidebarCounts(tasks: Task[], now: Date = new Date()): SidebarCounts {
  const todayKey = getTodayKey(now);
  let today = 0;
  let overdue = 0;
  let upcoming = 0;
  let allOpen = 0;
  let completed = 0;
  const byTag: Record<number, number> = {};

  for (const task of tasks) {
    if (task.completed) {
      completed += 1;
      continue;
    }

    allOpen += 1;
    const dueKey = extractDateKey(task.due_date);

    if (dueKey) {
      if (isOverdueDate(task.due_date, false, now)) {
        overdue += 1;
        today += 1;
      } else if (dueKey === todayKey) {
        today += 1;
      } else if (dueKey > todayKey) {
        upcoming += 1;
      }
    }

    for (const tag of task.tags ?? []) {
      byTag[tag.id] = (byTag[tag.id] ?? 0) + 1;
    }
  }

  return { today, overdue, upcoming, allOpen, completed, byTag };
}

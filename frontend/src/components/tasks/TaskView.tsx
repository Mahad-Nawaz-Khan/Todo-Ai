"use client";

import { CalendarDays, CircleCheck, Inbox, Sun, Tag as TagIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTasks } from "@/context/TasksContext";
import { useUI } from "@/context/UIContext";
import { useTags } from "@/hooks/useTags";
import { useTaskSelection } from "@/hooks/useTaskSelection";
import { formatFullDateHeading, getTodayKey, getTomorrowKey } from "@/lib/dates";
import { resolveTagColor } from "@/lib/tagColors";
import {
  selectAllTasks,
  selectByTag,
  selectCompletedGroups,
  selectToday,
  selectUpcomingGroups,
  type AllTasksFilter,
  type TaskGroupBucket,
  type TaskGroupMode,
  type TaskSortField,
  type TaskSortOrder,
} from "@/lib/taskViews";
import type { Priority, Task } from "@/types/task";

import { DisplayMenu, type DisplaySettings } from "./DisplayMenu";
import { FilterBar } from "./FilterBar";
import { QuickAdd, type QuickAddDefaults } from "./QuickAdd";
import { TaskGroup } from "./TaskGroup";
import { TaskRowSkeleton } from "./TaskRowSkeleton";
import { TaskViewHeader } from "./TaskViewHeader";

export type TaskViewKind = "today" | "upcoming" | "tasks" | "completed" | "tag";

export interface TaskViewProps {
  view: TaskViewKind;
  tagId?: number;
}

const VALID_PRIORITIES = new Set<string>(["HIGH", "MEDIUM", "LOW"]);
const VALID_SORTS = new Set<string>(["created_at", "updated_at", "due_date", "priority"]);
const VALID_GROUPS = new Set<string>(["priority", "due_date", "tag", "none"]);

function readAllFiltersFromParams(params: URLSearchParams): AllTasksFilter {
  const statusRaw = params.get("status");
  const status =
    statusRaw === "all" || statusRaw === "done" || statusRaw === "open" ? statusRaw : "open";
  const priorityRaw = params.get("priority") ?? "";
  const priority = VALID_PRIORITIES.has(priorityRaw) ? (priorityRaw as Priority) : "";
  const sortRaw = params.get("sort") ?? "";
  const sortBy = VALID_SORTS.has(sortRaw) ? (sortRaw as TaskSortField) : "priority";
  const orderRaw = params.get("order");
  const order: TaskSortOrder = orderRaw === "asc" || orderRaw === "desc" ? orderRaw : "desc";
  const groupRaw = params.get("group") ?? "";
  const groupBy = VALID_GROUPS.has(groupRaw) ? (groupRaw as TaskGroupMode) : "priority";
  const search = params.get("q") ?? "";
  const showCompleted = status === "done" || params.get("completed") === "1";

  return { status, priority, search, sortBy, order, groupBy, showCompleted };
}

function getDefaultDisplay(view: TaskViewKind): DisplaySettings {
  if (view === "upcoming") {
    return { sortBy: "due_date", order: "asc", showCompleted: false };
  }
  return { groupBy: "priority", sortBy: "priority", order: "desc", showCompleted: false };
}

function renderEmptyView(
  view: TaskViewKind,
  hasActiveFilters: boolean,
  onClearFilters: () => void,
  onQuickAdd: () => void,
  onAskAI: () => void
) {
  if (view === "tasks" && hasActiveFilters) {
    return (
      <EmptyState
        icon={<Inbox className="size-5" />}
        title="No matching tasks"
        description="Try adjusting your search or clearing active filters."
        actions={
          <Button variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  }

  const configs: Record<TaskViewKind, { icon: typeof Sun; title: string; description: string }> = {
    today: {
      icon: Sun,
      title: "All clear for today",
      description: "Nothing left due today. Capture a new task or review what's coming up.",
    },
    upcoming: {
      icon: CalendarDays,
      title: "Nothing scheduled",
      description: "Tasks with a future due date will organize here by day.",
    },
    tasks: {
      icon: Inbox,
      title: "No tasks yet",
      description: "Capture your first task above or ask the AI assistant to plan your work.",
    },
    completed: {
      icon: CircleCheck,
      title: "Nothing completed yet",
      description: "Checked-off tasks appear here so you can review or reopen them anytime.",
    },
    tag: {
      icon: TagIcon,
      title: "No tasks with this tag",
      description: "Add a task below to tag it automatically.",
    },
  };

  const cfg = configs[view];
  const Icon = cfg.icon;

  return (
    <EmptyState
      icon={<Icon className="size-5" />}
      title={cfg.title}
      description={cfg.description}
      actions={
        <>
          {view === "today" ? (
            <Link
              href="/upcoming"
              className="inline-flex h-8 items-center rounded-md border border-line bg-surface px-3 text-sm font-medium text-fg shadow-xs hover:bg-hover"
            >
              Plan upcoming
            </Link>
          ) : null}
          {view === "tasks" ? (
            <>
              <Button variant="primary" onClick={onQuickAdd}>
                Add your first task
              </Button>
              <Button variant="secondary" onClick={onAskAI}>
                Ask AI
              </Button>
            </>
          ) : null}
        </>
      }
    />
  );
}

export function TaskView({ view, tagId }: Readonly<TaskViewProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tasks, loading, error, pendingIds, refreshTasks, toggleTask, updateTask, deleteTask } =
    useTasks();
  const { tags } = useTags();
  const { setQuickAddOpen, setAssistantOpen, confirm } = useUI();

  const [display, setDisplay] = useState<DisplaySettings>(() => getDefaultDisplay(view));
  const [graceIds, setGraceIds] = useState<Set<number>>(() => new Set());
  const graceTimersRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    const timers = graceTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const allFilters = useMemo(
    () => readAllFiltersFromParams(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams]
  );

  const updateAllFilters = useCallback(
    (patch: Partial<AllTasksFilter>) => {
      const next = { ...allFilters, ...patch };
      const params = new URLSearchParams(searchParams?.toString() ?? "");

      const setOrDelete = (k: string, v: string, defaultVal: string) => {
        if (!v || v === defaultVal) params.delete(k);
        else params.set(k, v);
      };

      setOrDelete("status", next.status, "open");
      setOrDelete("priority", next.priority, "");
      setOrDelete("sort", next.sortBy, "priority");
      setOrDelete("order", next.order, "desc");
      setOrDelete("group", next.groupBy, "priority");
      setOrDelete("q", next.search.trim(), "");
      if (next.showCompleted) params.set("completed", "1");
      else params.delete("completed");

      const currentPath = pathname ?? "/tasks";
      const qs = params.toString();
      router.replace(qs ? `${currentPath}?${qs}` : currentPath, { scroll: false });
    },
    [allFilters, pathname, router, searchParams]
  );

  const openTaskDrawer = useCallback(
    (taskId: number) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("task", String(taskId));
      const currentPath = pathname ?? "/today";
      router.push(`${currentPath}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const activeDrawerTaskId = useMemo(() => {
    const raw = searchParams?.get("task") ?? null;
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const handleToggleWithGrace = useCallback(
    (task: Task) => {
      const hidesCompleted =
        view === "tasks" ? allFilters.status === "open" && !allFilters.showCompleted : view !== "completed" && !display.showCompleted;

      if (!task.completed && hidesCompleted) {
        setGraceIds((prev) => new Set(prev).add(task.id));
        const existing = graceTimersRef.current.get(task.id);
        if (existing) window.clearTimeout(existing);
        const timer = window.setTimeout(() => {
          graceTimersRef.current.delete(task.id);
          setGraceIds((prev) => {
            const next = new Set(prev);
            next.delete(task.id);
            return next;
          });
        }, 800);
        graceTimersRef.current.set(task.id, timer);
      }
      void toggleTask(task, true);
    },
    [allFilters.showCompleted, allFilters.status, display.showCompleted, toggleTask, view]
  );

  const handleDeleteConfirm = useCallback(
    async (task: Task) => {
      const ok = await confirm({
        title: "Delete task?",
        description: `“${task.title}” will be permanently deleted. This can't be undone.`,
        confirmLabel: "Delete",
        tone: "danger",
      });
      if (ok) {
        await deleteTask(task);
      }
    },
    [confirm, deleteTask]
  );

  const handleQuickUpdate = useCallback(
    (taskId: number, patch: { priority?: Priority; due_date?: string | null }) => {
      void updateTask(taskId, patch);
    },
    [updateTask]
  );

  const currentTag = useMemo(
    () => (view === "tag" && tagId ? tags.find((t) => t.id === tagId) ?? null : null),
    [tagId, tags, view]
  );

  const computed = useMemo(() => {
    const applyGraceShowCompleted = (baseShow: boolean) => baseShow;
    const tasksWithGrace = tasks.map((t) =>
      graceIds.has(t.id) && t.completed ? { ...t, completed: false, __graceCompleted: true } : t
    );

    if (view === "today") {
      const realToday = selectToday(tasks, {
        showCompleted: applyGraceShowCompleted(display.showCompleted),
        sortBy: display.sortBy,
        order: display.order,
      });
      if (!graceIds.size || display.showCompleted) {
        return {
          groups: realToday.groups,
          progress: { completed: realToday.completedTodayCount, total: realToday.totalTodayScope },
          count: realToday.groups.reduce((sum, g) => sum + g.tasks.length, 0),
        };
      }
      const displayToday = selectToday(tasksWithGrace, {
        showCompleted: false,
        sortBy: display.sortBy,
        order: display.order,
      });
      const restoredGroups = displayToday.groups.map((g) => ({
        ...g,
        tasks: g.tasks.map((t) => tasks.find((orig) => orig.id === t.id) ?? t),
      }));
      return {
        groups: restoredGroups,
        progress: { completed: realToday.completedTodayCount, total: realToday.totalTodayScope },
        count: restoredGroups.reduce((sum, g) => sum + g.tasks.length, 0),
      };
    }

    if (view === "upcoming") {
      const groups = selectUpcomingGroups(tasksWithGrace, {
        showCompleted: display.showCompleted,
        sortBy: display.sortBy,
        order: display.order,
      }).map((g) => ({
        ...g,
        tasks: g.tasks.map((t) => tasks.find((orig) => orig.id === t.id) ?? t),
      }));
      return {
        groups,
        progress: null,
        count: groups.reduce((sum, g) => sum + g.tasks.length, 0),
      };
    }

    if (view === "completed") {
      const groups = selectCompletedGroups(tasks);
      return {
        groups,
        progress: null,
        count: groups.reduce((sum, g) => sum + g.tasks.length, 0),
      };
    }

    if (view === "tag" && tagId) {
      const res = selectByTag(tasksWithGrace, tagId, {
        showCompleted: display.showCompleted,
        sortBy: display.sortBy,
        order: display.order,
        groupBy: display.groupBy,
      });
      const groups = res.groups.map((g) => ({
        ...g,
        tasks: g.tasks.map((t) => tasks.find((orig) => orig.id === t.id) ?? t),
      }));
      return { groups, progress: null, count: res.matchCount };
    }

    const res = selectAllTasks(tasksWithGrace, allFilters);
    const groups: TaskGroupBucket[] = res.groups.map((g) => ({
      ...g,
      tasks: g.tasks.map((t) => tasks.find((orig) => orig.id === t.id) ?? t),
    }));
    return { groups, progress: null, count: res.matchCount };
  }, [allFilters, display.groupBy, display.order, display.showCompleted, display.sortBy, graceIds, tagId, tasks, view]);

  const orderedTasks = useMemo(
    () => computed.groups.flatMap((g) => g.tasks),
    [computed.groups]
  );

  const { selectedTaskId } = useTaskSelection({
    orderedTasks,
    onOpenTask: openTaskDrawer,
    onToggleTask: handleToggleWithGrace,
    onDeleteTask: handleDeleteConfirm,
  });

  const quickAddDefaults = useMemo<QuickAddDefaults>(() => {
    if (view === "today") return { dueDate: getTodayKey() };
    if (view === "upcoming") return { dueDate: getTomorrowKey() };
    if (view === "tag" && tagId) return { tagIds: [tagId] };
    return {};
  }, [tagId, view]);

  let title = "All tasks";
  let subtitle = `${computed.count} matching`;
  if (view === "today") {
    title = "Today";
    subtitle = formatFullDateHeading();
  } else if (view === "upcoming") {
    title = "Upcoming";
    subtitle = "Next 7 days and beyond";
  } else if (view === "completed") {
    title = "Completed";
    subtitle = `${computed.count} completed`;
  } else if (view === "tag") {
    title = currentTag ? `#${currentTag.name}` : "Tag";
    subtitle = `${computed.count} tasks`;
  }

  const displaySettingsForMenu: DisplaySettings =
    view === "tasks"
      ? {
          groupBy: allFilters.groupBy,
          sortBy: allFilters.sortBy,
          order: allFilters.order,
          showCompleted: allFilters.showCompleted,
        }
      : display;

  const handleDisplayChange = (patch: Partial<DisplaySettings>) => {
    if (view === "tasks") {
      updateAllFilters(patch);
      return;
    }
    setDisplay((prev) => ({ ...prev, ...patch }));
  };

  const hasFilters =
    allFilters.status !== "open" ||
    Boolean(allFilters.priority) ||
    Boolean(allFilters.search.trim());

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-5">
      <TaskViewHeader
        title={title}
        titlePrefix={
          view === "tag" && currentTag ? (
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: resolveTagColor(currentTag.color) }}
            />
          ) : null
        }
        subtitle={subtitle}
        progress={computed.progress}
        rightSlot={
          view !== "completed" ? (
            <DisplayMenu
              settings={displaySettingsForMenu}
              showGroupOption={view === "tasks" || view === "tag"}
              onChange={handleDisplayChange}
            />
          ) : null
        }
      />

      {view === "tasks" ? (
        <FilterBar
          filters={allFilters}
          onChange={updateAllFilters}
          onClearAll={() =>
            updateAllFilters({
              status: "open",
              priority: "",
              search: "",
              showCompleted: false,
            })
          }
        />
      ) : null}

      {view !== "completed" ? (
        <QuickAdd defaults={quickAddDefaults} onOpenTask={openTaskDrawer} />
      ) : null}

      {error ? (
        <Callout
          tone="error"
          title="Could not load tasks"
          action={
            <Button variant="secondary" size="sm" onClick={() => void refreshTasks()}>
              Retry
            </Button>
          }
        >
          {error}
        </Callout>
      ) : null}

      {loading ? <TaskRowSkeleton count={6} /> : null}

      {!loading && computed.groups.length === 0
        ? renderEmptyView(
            view,
            hasFilters,
            () =>
              updateAllFilters({
                status: "open",
                priority: "",
                search: "",
                showCompleted: false,
              }),
            () => setQuickAddOpen(true),
            () => setAssistantOpen(true)
          )
        : null}

      {!loading && computed.groups.length > 0 ? (
        <div className="space-y-5">
          {computed.groups.map((group) => (
            <TaskGroup
              key={group.key}
              group={group}
              selectedTaskId={selectedTaskId}
              activeDrawerTaskId={activeDrawerTaskId}
              pendingIds={pendingIds}
              onOpenTask={openTaskDrawer}
              onToggleTask={handleToggleWithGrace}
              onQuickUpdate={handleQuickUpdate}
              onDeleteTask={handleDeleteConfirm}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { TaskGroupBucket } from "@/lib/taskViews";
import { cn } from "@/lib/utils";
import type { Priority, Task } from "@/types/task";

import { TaskRow } from "./TaskRow";

const TONE_CLASSES: Record<NonNullable<TaskGroupBucket["tone"]>, string> = {
  danger: "text-danger",
  accent: "text-accent-text",
  default: "text-fg-muted",
};

function readCollapsedState(storageKey: string): boolean {
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

export interface TaskGroupProps {
  group: TaskGroupBucket;
  selectedTaskId: number | null;
  activeDrawerTaskId: number | null;
  pendingIds: Set<number>;
  onOpenTask: (taskId: number) => void;
  onToggleTask: (task: Task) => void;
  onQuickUpdate: (taskId: number, patch: { priority?: Priority; due_date?: string | null }) => void;
  onDeleteTask: (task: Task) => void;
}

export function TaskGroup({
  group,
  selectedTaskId,
  activeDrawerTaskId,
  pendingIds,
  onOpenTask,
  onToggleTask,
  onQuickUpdate,
  onDeleteTask,
}: Readonly<TaskGroupProps>) {
  const storageKey = `todo-group-collapsed:${group.key}`;
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    typeof window !== "undefined" ? readCollapsedState(storageKey) : false
  );

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(storageKey, String(next));
    } catch {
      // Ignore storage write errors
    }
  };

  return (
    <section className="space-y-1">
      <div className="sticky top-[52px] z-10 -mx-1 bg-[var(--bg-group-sticky)] px-1 py-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          className="inline-flex h-7 items-center gap-1.5 rounded-sm px-1 text-[13px] font-semibold tracking-[-0.006em] hover:bg-hover"
        >
          {collapsed ? (
            <ChevronRight className="size-3.5 text-fg-subtle" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3.5 text-fg-subtle" aria-hidden="true" />
          )}
          <span className={TONE_CLASSES[group.tone ?? "default"]}>{group.label}</span>
          <span className="text-xs font-medium text-fg-subtle tabular-nums">{group.tasks.length}</span>
        </button>
      </div>

      {!collapsed ? (
        <ul
          className={cn(
            "divide-y divide-line-subtle overflow-hidden rounded-lg border border-line-subtle bg-surface"
          )}
        >
          {group.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={selectedTaskId === task.id}
              active={activeDrawerTaskId === task.id}
              pending={pendingIds.has(task.id)}
              onOpen={onOpenTask}
              onToggle={onToggleTask}
              onQuickUpdate={onQuickUpdate}
              onDelete={onDeleteTask}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

"use client";

import { MoreHorizontal, Pencil, Repeat2, Trash2 } from "lucide-react";
import { memo } from "react";

import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { Tooltip } from "@/components/ui/Tooltip";
import { getTodayKey, getTomorrowKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Priority, RecurrenceValue, Task } from "@/types/task";

import { DueChip } from "./DueChip";
import { PriorityIcon } from "./PriorityIcon";
import { TagChip } from "./TagChip";
import { TaskCheckbox } from "./TaskCheckbox";

const RECURRENCE_LABELS: Record<RecurrenceValue, string> = {
  DAILY: "Repeats daily",
  WEEKLY: "Repeats weekly",
  MONTHLY: "Repeats monthly",
};

export interface TaskRowProps {
  task: Task;
  selected?: boolean;
  active?: boolean;
  pending?: boolean;
  onOpen: (taskId: number) => void;
  onToggle: (task: Task) => void;
  onQuickUpdate: (taskId: number, patch: { priority?: Priority; due_date?: string | null }) => void;
  onDelete: (task: Task) => void;
}

export const TaskRow = memo(function TaskRow({
  task,
  selected = false,
  active = false,
  pending = false,
  onOpen,
  onToggle,
  onQuickUpdate,
  onDelete,
}: Readonly<TaskRowProps>) {
  const tags = task.tags ?? [];
  const visibleTags = tags.slice(0, 2);
  const overflowCount = Math.max(0, tags.length - 2);
  const showPriorityFlag = task.priority === "HIGH" || task.priority === "MEDIUM";

  return (
    <li
      data-task-id={task.id}
      className={cn(
        "group relative flex min-h-[56px] items-center gap-2.5 rounded-md px-3 py-2 transition-colors duration-[var(--dur-fast)] has-[>button:focus-visible]:outline-2 has-[>button:focus-visible]:outline-offset-2 has-[>button:focus-visible]:outline-[var(--focus-ring)] md:min-h-[40px] md:py-1.5",
        selected || active
          ? "bg-selected shadow-[inset_0_0_0_1px_var(--accent-border)]"
          : "hover:bg-hover",
        pending && "opacity-60"
      )}
    >
      <TaskCheckbox
        title={task.title}
        checked={task.completed}
        priority={task.priority || "MEDIUM"}
        onToggle={() => onToggle(task)}
      />

      <button
        type="button"
        onClick={() => onOpen(task.id)}
        className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left outline-none md:flex-row md:items-center md:gap-2.5"
      >
        <span
          className={cn(
            "w-full truncate text-sm font-medium transition-colors duration-[var(--dur-base)] md:w-auto md:max-w-[55%] md:shrink-0",
            task.completed ? "text-fg-subtle line-through" : "text-fg"
          )}
        >
          {task.title}
        </span>

        {task.description ? (
          <span className="hidden min-w-0 flex-1 truncate text-sm text-fg-subtle lg:inline">
            {task.description}
          </span>
        ) : (
          <span className="hidden flex-1 md:inline" />
        )}

        <span className="flex flex-wrap items-center gap-1.5 md:ml-auto md:shrink-0 md:flex-nowrap">
          {visibleTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} dimmed={task.completed} />
          ))}
          {overflowCount > 0 ? (
            <span className="inline-flex h-5 items-center rounded-full bg-hover px-1.5 text-[11px] font-medium text-fg-subtle tabular-nums">
              +{overflowCount}
            </span>
          ) : null}

          {task.recurrence_rule ? (
            <Tooltip label={RECURRENCE_LABELS[task.recurrence_rule]}>
              <span className="inline-flex items-center text-fg-subtle">
                <Repeat2 className="size-3.5" aria-hidden="true" />
              </span>
            </Tooltip>
          ) : null}

          {showPriorityFlag ? <PriorityIcon priority={task.priority} /> : null}

          <DueChip dueDate={task.due_date} completed={task.completed} />
        </span>
      </button>

      <Menu
        align="end"
        minWidth={190}
        trigger={({ ref, isOpen, toggle }) => (
          <button
            ref={ref}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            aria-expanded={isOpen}
            aria-label={`Actions for “${task.title}”`}
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-fg-subtle transition-opacity duration-[var(--dur-fast)] hover:bg-selected hover:text-fg focus-visible:opacity-100",
              isOpen ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
            )}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>
        )}
      >
        {({ close }) => (
          <>
            <MenuItem
              icon={<Pencil className="size-4" />}
              label="Open details"
              shortcut="↵"
              onSelect={() => {
                close();
                onOpen(task.id);
              }}
            />
            <MenuSeparator />
            <MenuItem
              icon={<PriorityIcon priority="HIGH" />}
              label="Priority: High"
              checked={task.priority === "HIGH"}
              onSelect={() => {
                close();
                onQuickUpdate(task.id, { priority: "HIGH" });
              }}
            />
            <MenuItem
              icon={<PriorityIcon priority="MEDIUM" />}
              label="Priority: Medium"
              checked={task.priority === "MEDIUM"}
              onSelect={() => {
                close();
                onQuickUpdate(task.id, { priority: "MEDIUM" });
              }}
            />
            <MenuItem
              icon={<PriorityIcon priority="LOW" />}
              label="Priority: Low"
              checked={task.priority === "LOW"}
              onSelect={() => {
                close();
                onQuickUpdate(task.id, { priority: "LOW" });
              }}
            />
            <MenuSeparator />
            <MenuItem
              label="Due today"
              onSelect={() => {
                close();
                onQuickUpdate(task.id, { due_date: getTodayKey() });
              }}
            />
            <MenuItem
              label="Due tomorrow"
              onSelect={() => {
                close();
                onQuickUpdate(task.id, { due_date: getTomorrowKey() });
              }}
            />
            {task.due_date ? (
              <MenuItem
                label="Clear due date"
                onSelect={() => {
                  close();
                  onQuickUpdate(task.id, { due_date: null });
                }}
              />
            ) : null}
            <MenuSeparator />
            <MenuItem
              icon={<Trash2 className="size-4" />}
              label="Delete"
              danger
              onSelect={() => {
                close();
                onDelete(task);
              }}
            />
          </>
        )}
      </Menu>
    </li>
  );
});

"use client";

import { cn } from "@/lib/utils";
import type { Priority } from "@/types/task";

const RING_CLASSES: Record<Priority, string> = {
  HIGH: "border-[var(--danger)] bg-[var(--danger-subtle)]",
  MEDIUM: "border-[var(--warning)] bg-[var(--warning-subtle)]",
  LOW: "border-line-strong bg-transparent",
};

export interface TaskCheckboxProps {
  title: string;
  checked: boolean;
  priority: Priority;
  disabled?: boolean;
  onToggle: () => void;
}

export function TaskCheckbox({
  title,
  checked,
  priority,
  disabled = false,
  onToggle,
}: Readonly<TaskCheckboxProps>) {
  const actionLabel = checked ? `Reopen “${title}”` : `Complete “${title}”`;

  return (
    <label
      onClick={(e) => e.stopPropagation()}
      className="relative -m-2 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full md:-m-1.5 md:size-8"
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        aria-label={actionLabel}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "group/cb flex size-[18px] items-center justify-center rounded-full border-[1.5px] transition-all duration-[var(--dur-base)] ease-[var(--ease-standard)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]",
          checked
            ? "border-accent bg-accent text-accent-fg"
            : cn(RING_CLASSES[priority], "hover:border-fg-muted")
        )}
      >
        <svg
          viewBox="0 0 12 12"
          fill="none"
          className={cn(
            "size-2.5 transition-opacity duration-[var(--dur-fast)]",
            checked ? "opacity-100" : "opacity-0 group-hover/cb:opacity-40"
          )}
        >
          <path
            d="M2.5 6.2L4.9 8.6L9.5 3.4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("task-check-path", checked && "task-check-animate")}
          />
        </svg>
      </span>
    </label>
  );
}

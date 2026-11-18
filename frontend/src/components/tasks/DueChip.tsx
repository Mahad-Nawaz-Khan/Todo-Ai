import { Calendar } from "lucide-react";

import { getRelativeDueMeta, type DueTone } from "@/lib/dates";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<DueTone, string> = {
  overdue: "text-danger",
  today: "text-accent-text",
  tomorrow: "text-warning",
  week: "text-fg-muted",
  later: "text-fg-subtle",
  completed: "text-fg-subtle",
  none: "text-fg-subtle",
};

const BADGE_CLASSES: Record<DueTone, string> = {
  overdue: "bg-danger-subtle text-danger border-danger-border",
  today: "bg-accent-subtle text-accent-text border-accent-border",
  tomorrow: "bg-warning-subtle text-warning border-warning-border",
  week: "bg-hover text-fg-muted border-transparent",
  later: "bg-hover text-fg-subtle border-transparent",
  completed: "bg-hover text-fg-subtle border-transparent",
  none: "bg-hover text-fg-subtle border-transparent",
};

export interface DueChipProps {
  dueDate?: string | null;
  completed?: boolean;
  variant?: "inline" | "badge";
  className?: string;
}

export function DueChip({
  dueDate,
  completed = false,
  variant = "inline",
  className,
}: Readonly<DueChipProps>) {
  const meta = getRelativeDueMeta(dueDate, completed);
  if (!meta) return null;

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 text-xs font-medium whitespace-nowrap tabular-nums",
          BADGE_CLASSES[meta.tone],
          className
        )}
      >
        <Calendar className="size-3 shrink-0" aria-hidden="true" />
        <span>{meta.label}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap tabular-nums",
        TONE_CLASSES[meta.tone],
        className
      )}
    >
      <Calendar className="size-3 shrink-0" aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}

"use client";

import { Calendar, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "./Button";

export interface DateFieldProps {
  id?: string;
  value: string;
  onChange: (nextDate: string) => void;
  quickChips?: { label: string; value: string }[];
  className?: string;
}

export function DateField({ id, value, onChange, quickChips = [], className }: Readonly<DateFieldProps>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {quickChips.map((chip) => {
        const active = value === chip.value;
        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => onChange(chip.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors duration-[var(--dur-fast)]",
              active
                ? "border-accent-border bg-accent-subtle text-accent-text"
                : "border-line bg-surface dark:bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg"
            )}
          >
            {chip.label}
          </button>
        );
      })}
      <div className="field-shell inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface dark:bg-surface-2 px-2 text-xs text-fg hover:border-line-strong">
        <Calendar className="size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-xs text-fg outline-none tabular-nums"
        />
      </div>
      {value ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange("")}
          aria-label="Clear due date"
          title="Clear due date"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

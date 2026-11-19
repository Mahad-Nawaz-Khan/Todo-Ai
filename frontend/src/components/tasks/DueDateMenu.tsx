"use client";

import { Calendar, CalendarArrowUp, CalendarDays, Sun, X } from "lucide-react";

import { Popover, type PopoverProps } from "@/components/ui/Popover";
import { extractDateKey, getNextWeekKey, getTodayKey, getTomorrowKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { DueChip } from "./DueChip";

function createDueDateTrigger(dateKey: string): PopoverProps["trigger"] {
  return function DueDateTrigger({ ref, isOpen, toggle }) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors duration-[var(--dur-fast)]",
          dateKey
            ? "border-accent-border bg-accent-subtle text-accent-text"
            : "border-line bg-surface dark:bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg"
        )}
      >
        {dateKey ? (
          <DueChip dueDate={dateKey} className="text-current" />
        ) : (
          <>
            <Calendar className="size-3.5 text-fg-subtle" aria-hidden="true" />
            <span>Due date</span>
          </>
        )}
      </button>
    );
  };
}

export interface DueDateMenuProps {
  value: string;
  onChange: (nextDate: string) => void;
  align?: "start" | "end";
}

export function DueDateMenu({ value, onChange, align = "start" }: Readonly<DueDateMenuProps>) {
  const today = getTodayKey();
  const tomorrow = getTomorrowKey();
  const nextWeek = getNextWeekKey();
  const dateKey = extractDateKey(value) ?? "";

  const presets = [
    { label: "Today", value: today, icon: Sun, hint: "Today" },
    { label: "Tomorrow", value: tomorrow, icon: CalendarArrowUp, hint: "Tmrw" },
    { label: "Next week", value: nextWeek, icon: CalendarDays, hint: "+7d" },
  ];

  return (
    <Popover
      align={align}
      maxWidth={240}
      trigger={createDueDateTrigger(dateKey)}
    >
      {({ close }) => (
        <div className="flex w-[220px] flex-col gap-0.5">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const selected = dateKey === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange(preset.value);
                  close();
                }}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-[13px] transition-colors",
                  selected
                    ? "bg-accent-subtle font-medium text-accent-text"
                    : "text-fg-muted hover:bg-hover hover:text-fg"
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{preset.label}</span>
                <span className="text-[11px] text-fg-subtle">{preset.hint}</span>
              </button>
            );
          })}
          <hr className="my-1 border-0 border-t border-line-subtle" />
          <label className="flex flex-col gap-1 px-2 py-1.5">
            <span className="text-[11px] font-medium text-fg-subtle">Pick date</span>
            <input
              type="date"
              value={dateKey}
              onChange={(e) => {
                onChange(e.target.value);
                close();
              }}
              className="field-control h-7 w-full rounded-sm border border-line bg-surface dark:bg-surface-2 px-2 text-xs text-fg tabular-nums"
            />
          </label>
          {dateKey ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                close();
              }}
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-[13px] text-danger transition-colors hover:bg-danger-subtle"
            >
              <X className="size-3.5" aria-hidden="true" />
              <span>No date</span>
            </button>
          ) : null}
        </div>
      )}
    </Popover>
  );
}

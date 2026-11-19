"use client";

import { Check, Repeat2 } from "lucide-react";

import { Popover, type PopoverProps } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import type { RecurrenceInput } from "@/types/task";

const OPTIONS: Array<{ value: RecurrenceInput; label: string }> = [
  { value: "", label: "No repeat" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

const LABEL_MAP: Record<RecurrenceInput, string> = {
  "": "Repeat",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

function createRecurrenceTrigger(value: RecurrenceInput): PopoverProps["trigger"] {
  return function RecurrenceTrigger({ ref, isOpen, toggle }) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors duration-[var(--dur-fast)]",
          value
            ? "border-accent-border bg-accent-subtle text-accent-text"
            : "border-line bg-surface dark:bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg"
        )}
      >
        <Repeat2 className="size-3.5" aria-hidden="true" />
        <span>{LABEL_MAP[value]}</span>
      </button>
    );
  };
}

export function RecurrenceMenu({
  value,
  onChange,
}: Readonly<{
  value: RecurrenceInput;
  onChange: (next: RecurrenceInput) => void;
}>) {
  return (
    <Popover
      align="start"
      maxWidth={180}
      trigger={createRecurrenceTrigger(value)}
    >
      {({ close }) => (
        <div className="flex w-[160px] flex-col gap-0.5">
          {OPTIONS.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value || "none"}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  close();
                }}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-[13px] transition-colors",
                  selected
                    ? "bg-hover font-medium text-fg"
                    : "text-fg-muted hover:bg-hover hover:text-fg"
                )}
              >
                <span className="flex-1">{opt.label}</span>
                {selected ? <Check className="size-3.5 text-accent-text" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

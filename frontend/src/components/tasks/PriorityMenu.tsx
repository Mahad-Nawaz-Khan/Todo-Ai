"use client";

import { Check } from "lucide-react";

import { Popover, type PopoverProps } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types/task";

import { PriorityIcon } from "./PriorityIcon";

const LABELS: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const OPTIONS: Priority[] = ["HIGH", "MEDIUM", "LOW"];

function createPriorityTrigger(
  value: Priority,
  hasExplicitValue: boolean
): PopoverProps["trigger"] {
  return function PriorityTrigger({ ref, isOpen, toggle }) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors duration-[var(--dur-fast)]",
          hasExplicitValue
            ? "border-accent-border bg-accent-subtle text-accent-text"
            : "border-line bg-surface dark:bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg"
        )}
      >
        <PriorityIcon priority={value} />
        <span>{hasExplicitValue ? LABELS[value] : "Priority"}</span>
      </button>
    );
  };
}

export function PriorityMenu({
  value,
  onChange,
  hasExplicitValue = false,
}: Readonly<{
  value: Priority;
  onChange: (next: Priority) => void;
  hasExplicitValue?: boolean;
}>) {
  return (
    <Popover
      align="start"
      maxWidth={180}
      trigger={createPriorityTrigger(value, hasExplicitValue)}
    >
      {({ close }) => (
        <div className="flex w-[160px] flex-col gap-0.5">
          {OPTIONS.map((opt) => {
            const selected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  close();
                }}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-[13px] transition-colors",
                  selected
                    ? "bg-hover font-medium text-fg"
                    : "text-fg-muted hover:bg-hover hover:text-fg"
                )}
              >
                <PriorityIcon priority={opt} />
                <span className="flex-1">{LABELS[opt]}</span>
                {selected ? <Check className="size-3.5 text-accent-text" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

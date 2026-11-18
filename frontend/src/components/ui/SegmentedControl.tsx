"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  legend: string;
  value: T;
  onChange: (next: T) => void;
  options: SegmentOption<T>[];
  name?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  legend,
  value,
  onChange,
  options,
  name,
  className,
}: Readonly<SegmentedControlProps<T>>) {
  const generatedName = useId();
  const groupName = name ?? generatedName;

  return (
    <fieldset
      className={cn(
        "inline-flex h-8 min-w-0 items-center gap-0.5 rounded-md border border-line-subtle bg-surface-2 p-0.5",
        className
      )}
    >
      <legend className="sr-only">{legend}</legend>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <label
            key={opt.value}
            className={cn(
              "relative inline-flex h-[26px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-2.5 text-[13px] font-medium whitespace-nowrap transition-all duration-[var(--dur-base)] ease-[var(--ease-standard)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-[var(--focus-ring)]",
              selected
                ? "bg-surface dark:bg-selected text-fg shadow-xs"
                : "text-fg-muted hover:text-fg"
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.icon}
            <span>{opt.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

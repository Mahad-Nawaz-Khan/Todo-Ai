"use client";

import { Check } from "lucide-react";

import type { ThemePreference } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

function MiniPreview({ mode }: Readonly<{ mode: ThemePreference }>) {
  if (mode === "light") {
    return (
      <div className="flex h-16 w-full overflow-hidden rounded-sm border border-neutral-200 bg-neutral-100">
        <div className="w-8 border-r border-neutral-200 bg-white p-1.5">
          <div className="size-2 rounded-xs bg-blue-800" />
          <div className="mt-2 h-1 w-4 rounded-full bg-neutral-300" />
          <div className="mt-1 h-1 w-3 rounded-full bg-neutral-200" />
        </div>
        <div className="flex-1 space-y-1.5 p-2">
          <div className="h-1.5 w-10 rounded-full bg-neutral-300" />
          <div className="h-3 rounded-xs border border-neutral-200 bg-white" />
          <div className="h-3 rounded-xs border border-neutral-200 bg-white" />
        </div>
      </div>
    );
  }

  if (mode === "dark") {
    return (
      <div className="flex h-16 w-full overflow-hidden rounded-sm border border-neutral-800 bg-neutral-950">
        <div className="w-8 border-r border-neutral-800 bg-neutral-900 p-1.5">
          <div className="size-2 rounded-xs bg-blue-700" />
          <div className="mt-2 h-1 w-4 rounded-full bg-neutral-700" />
          <div className="mt-1 h-1 w-3 rounded-full bg-neutral-800" />
        </div>
        <div className="flex-1 space-y-1.5 p-2">
          <div className="h-1.5 w-10 rounded-full bg-neutral-700" />
          <div className="h-3 rounded-xs border border-neutral-800 bg-neutral-900" />
          <div className="h-3 rounded-xs border border-neutral-800 bg-neutral-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-16 w-full overflow-hidden rounded-sm border border-line">
      <div className="flex flex-1 flex-col gap-1.5 bg-neutral-100 p-2">
        <div className="size-2 rounded-xs bg-blue-800" />
        <div className="h-3 rounded-xs border border-neutral-200 bg-white" />
        <div className="h-3 rounded-xs border border-neutral-200 bg-white" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 bg-neutral-950 p-2">
        <div className="size-2 rounded-xs bg-blue-700" />
        <div className="h-3 rounded-xs border border-neutral-800 bg-neutral-900" />
        <div className="h-3 rounded-xs border border-neutral-800 bg-neutral-900" />
      </div>
    </div>
  );
}

export interface ThemeCardProps {
  mode: ThemePreference;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function ThemeCard({ mode, label, selected, onSelect }: Readonly<ThemeCardProps>) {
  return (
    <label
      className={cn(
        "relative flex w-[160px] cursor-pointer flex-col gap-2 rounded-lg border p-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]",
        selected
          ? "border-2 border-accent-text bg-accent-subtle"
          : "border-line bg-surface hover:border-line-strong"
      )}
    >
      <input
        type="radio"
        name="appearance-theme"
        value={mode}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      {selected ? (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-accent text-accent-fg shadow-xs"
        >
          <Check className="size-2.5 stroke-[3]" />
        </span>
      ) : null}
      <MiniPreview mode={mode} />
      <span className="text-center text-xs font-medium text-fg">{label}</span>
    </label>
  );
}

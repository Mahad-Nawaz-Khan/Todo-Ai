"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Kbd } from "@/components/ui/Kbd";
import { Select } from "@/components/ui/Select";
import { useHotkeys } from "@/hooks/useHotkeys";
import type { AllTasksFilter } from "@/lib/taskViews";
import type { Priority } from "@/types/task";

export interface FilterBarProps {
  filters: AllTasksFilter;
  onChange: (patch: Partial<AllTasksFilter>) => void;
  onClearAll: () => void;
}

const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const STATUS_LABELS: Record<AllTasksFilter["status"], string> = {
  all: "All",
  open: "Open",
  done: "Completed",
};

export function FilterBar({ filters, onChange, onClearAll }: Readonly<FilterBarProps>) {
  const searchRef = useRef<HTMLInputElement | null>(null);

  useHotkeys([
    {
      combo: "/",
      handler: () => searchRef.current?.focus(),
    },
  ]);

  const hasActiveChips =
    filters.status !== "open" ||
    Boolean(filters.priority) ||
    Boolean(filters.search.trim());

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            ref={searchRef}
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Filter tasks by title, notes, or tag…"
            leadingIcon={<Search className="size-3.5" aria-hidden="true" />}
            trailingSlot={
              filters.search ? (
                <button
                  type="button"
                  onClick={() => onChange({ search: "" })}
                  aria-label="Clear search"
                  className="text-fg-subtle hover:text-fg"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <Kbd>/</Kbd>
              )
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) =>
              onChange({ status: e.target.value as AllTasksFilter["status"] })
            }
            className="w-32"
            options={[
              { value: "open", label: "Open" },
              { value: "done", label: "Completed" },
              { value: "all", label: "All statuses" },
            ]}
          />
          <Select
            aria-label="Filter by priority"
            value={filters.priority}
            onChange={(e) => onChange({ priority: e.target.value as "" | Priority })}
            className="w-36"
            options={[
              { value: "", label: "All priorities" },
              { value: "HIGH", label: "High priority" },
              { value: "MEDIUM", label: "Medium priority" },
              { value: "LOW", label: "Low priority" },
            ]}
          />
        </div>
      </div>

      {hasActiveChips ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.status !== "open" ? (
            <button
              type="button"
              onClick={() => onChange({ status: "open" })}
              className="inline-flex h-6 items-center gap-1 rounded-sm border border-line bg-surface px-2 text-xs font-medium text-fg-muted hover:border-line-strong hover:text-fg"
            >
              <span>Status: {STATUS_LABELS[filters.status]}</span>
              <X className="size-3" aria-hidden="true" />
            </button>
          ) : null}

          {filters.priority ? (
            <button
              type="button"
              onClick={() => onChange({ priority: "" })}
              className="inline-flex h-6 items-center gap-1 rounded-sm border border-accent-border bg-accent-subtle px-2 text-xs font-medium text-accent-text"
            >
              <span>Priority: {PRIORITY_LABELS[filters.priority]}</span>
              <X className="size-3" aria-hidden="true" />
            </button>
          ) : null}

          {filters.search.trim() ? (
            <button
              type="button"
              onClick={() => onChange({ search: "" })}
              className="inline-flex h-6 items-center gap-1 rounded-sm border border-line bg-surface px-2 text-xs font-medium text-fg-muted hover:text-fg"
            >
              <span>Query: “{filters.search.trim()}”</span>
              <X className="size-3" aria-hidden="true" />
            </button>
          ) : null}

          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 px-2 text-xs">
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  );
}

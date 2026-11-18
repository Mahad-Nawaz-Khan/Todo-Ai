"use client";

import { ArrowUpDown, SlidersHorizontal } from "lucide-react";

import { Popover } from "@/components/ui/Popover";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import type { TaskGroupMode, TaskSortField, TaskSortOrder } from "@/lib/taskViews";

export interface DisplaySettings {
  groupBy?: TaskGroupMode;
  sortBy: TaskSortField;
  order: TaskSortOrder;
  showCompleted: boolean;
}

export interface DisplayMenuProps {
  settings: DisplaySettings;
  showGroupOption?: boolean;
  showCompletedOption?: boolean;
  onChange: (patch: Partial<DisplaySettings>) => void;
}

export function DisplayMenu({
  settings,
  showGroupOption = false,
  showCompletedOption = true,
  onChange,
}: Readonly<DisplayMenuProps>) {
  return (
    <Popover
      align="end"
      maxWidth={260}
      trigger={({ ref, isOpen, toggle }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[13px] font-medium text-fg-muted transition-colors duration-[var(--dur-fast)] hover:border-line-strong hover:text-fg"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          <span>Display</span>
        </button>
      )}
    >
      {() => (
        <div className="flex w-[240px] flex-col gap-3 p-2.5 text-sm">
          {showGroupOption ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-subtle">Group by</span>
              <Select
                selectSize="sm"
                value={settings.groupBy ?? "priority"}
                onChange={(e) => onChange({ groupBy: e.target.value as TaskGroupMode })}
                options={[
                  { value: "priority", label: "Priority" },
                  { value: "due_date", label: "Due date" },
                  { value: "tag", label: "Tag" },
                  { value: "none", label: "No grouping" },
                ]}
              />
            </label>
          ) : null}

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-subtle">Sort by</span>
            <div className="flex items-center gap-1.5">
              <Select
                selectSize="sm"
                aria-label="Sort by"
                value={settings.sortBy}
                onChange={(e) => onChange({ sortBy: e.target.value as TaskSortField })}
                options={[
                  { value: "priority", label: "Priority" },
                  { value: "due_date", label: "Due date" },
                  { value: "created_at", label: "Created" },
                  { value: "updated_at", label: "Updated" },
                ]}
              />
              <button
                type="button"
                onClick={() => onChange({ order: settings.order === "asc" ? "desc" : "asc" })}
                aria-label={`Sort order: ${settings.order === "asc" ? "Ascending" : "Descending"}`}
                title={settings.order === "asc" ? "Ascending" : "Descending"}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface dark:bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg"
              >
                <ArrowUpDown className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {showCompletedOption ? (
            <div className="flex items-center justify-between border-t border-line-subtle pt-2.5">
              <span className="text-[13px] text-fg-muted">Show completed</span>
              <Switch
                checked={settings.showCompleted}
                onChange={(e) => onChange({ showCompleted: e.target.checked })}
                aria-label="Show completed tasks"
              />
            </div>
          ) : null}
        </div>
      )}
    </Popover>
  );
}

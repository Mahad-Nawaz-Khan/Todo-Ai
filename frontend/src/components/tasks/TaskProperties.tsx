"use client";

import { Calendar, CheckCircle2, Flag, Hash, Plus, Repeat2 } from "lucide-react";

import { DateField } from "@/components/ui/DateField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { getTodayKey, getTomorrowKey } from "@/lib/dates";
import type { Tag } from "@/types/tag";
import type { Priority, RecurrenceInput } from "@/types/task";

import { PriorityIcon } from "./PriorityIcon";
import { TagChip } from "./TagChip";
import { TagPicker } from "./TagPicker";

export interface TaskPropertiesProps {
  completed: boolean;
  onCompletedChange: (next: boolean) => void;
  priority: Priority;
  onPriorityChange: (next: Priority) => void;
  dueDate: string;
  onDueDateChange: (next: string) => void;
  recurrence: RecurrenceInput;
  onRecurrenceChange: (next: RecurrenceInput) => void;
  tagIds: number[];
  onTagIdsChange: (next: number[]) => void;
  allTags: Tag[];
}

export function TaskProperties({
  completed,
  onCompletedChange,
  priority,
  onPriorityChange,
  dueDate,
  onDueDateChange,
  recurrence,
  onRecurrenceChange,
  tagIds,
  onTagIdsChange,
  allTags,
}: Readonly<TaskPropertiesProps>) {
  const selectedTagObjects = allTags.filter((tag) => tagIds.includes(tag.id));
  const today = getTodayKey();
  const tomorrow = getTomorrowKey();

  return (
    <div className="space-y-3 border-t border-line-subtle pt-4">
      <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
        <span className="flex items-center gap-2 text-[13px] font-medium text-fg-subtle">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          <span>Status</span>
        </span>
        <SegmentedControl
          legend="Task status"
          value={completed ? "done" : "open"}
          onChange={(val) => onCompletedChange(val === "done")}
          options={[
            { value: "open", label: "Open" },
            { value: "done", label: "Completed" },
          ]}
        />
      </div>

      <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
        <span className="flex items-center gap-2 text-[13px] font-medium text-fg-subtle">
          <Flag className="size-4 shrink-0" aria-hidden="true" />
          <span>Priority</span>
        </span>
        <SegmentedControl
          legend="Task priority"
          value={priority}
          onChange={(val) => onPriorityChange(val)}
          options={[
            { value: "LOW", label: "Low", icon: <PriorityIcon priority="LOW" /> },
            { value: "MEDIUM", label: "Medium", icon: <PriorityIcon priority="MEDIUM" /> },
            { value: "HIGH", label: "High", icon: <PriorityIcon priority="HIGH" /> },
          ]}
        />
      </div>

      <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-3 pt-0.5">
        <label
          htmlFor="drawer-due-date"
          className="flex h-7 items-center gap-2 text-[13px] font-medium text-fg-subtle"
        >
          <Calendar className="size-4 shrink-0" aria-hidden="true" />
          <span>Due</span>
        </label>
        <DateField
          id="drawer-due-date"
          value={dueDate}
          onChange={onDueDateChange}
          quickChips={[
            { label: "Today", value: today },
            { label: "Tmrw", value: tomorrow },
          ]}
        />
      </div>

      <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
        <label
          htmlFor="drawer-repeat"
          className="flex items-center gap-2 text-[13px] font-medium text-fg-subtle"
        >
          <Repeat2 className="size-4 shrink-0" aria-hidden="true" />
          <span>Repeat</span>
        </label>
        <Select
          id="drawer-repeat"
          selectSize="sm"
          value={recurrence}
          onChange={(e) => onRecurrenceChange(e.target.value as RecurrenceInput)}
          className="max-w-[180px]"
          options={[
            { value: "", label: "No recurrence" },
            { value: "DAILY", label: "Daily" },
            { value: "WEEKLY", label: "Weekly" },
            { value: "MONTHLY", label: "Monthly" },
          ]}
        />
      </div>

      <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-3 pt-0.5">
        <span className="flex h-6 items-center gap-2 text-[13px] font-medium text-fg-subtle">
          <Hash className="size-4 shrink-0" aria-hidden="true" />
          <span>Tags</span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedTagObjects.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              onRemove={() => onTagIdsChange(tagIds.filter((id) => id !== tag.id))}
            />
          ))}
          <TagPicker
            selectedTagIds={tagIds}
            onChange={onTagIdsChange}
            renderTrigger={({ isOpen, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={isOpen}
                className="inline-flex h-6 items-center gap-1 rounded-full border border-dashed border-line-strong px-2 text-xs font-medium text-fg-muted transition-colors hover:border-accent-border hover:text-accent-text"
              >
                <Plus className="size-3" aria-hidden="true" />
                <span>Add</span>
              </button>
            )}
          />
        </div>
      </div>
    </div>
  );
}

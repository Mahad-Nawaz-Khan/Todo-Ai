"use client";

import { Plus, Sparkles } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Textarea";
import { useTasks } from "@/context/TasksContext";
import { useUI } from "@/context/UIContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTags } from "@/hooks/useTags";
import { parseQuickAddText } from "@/lib/quickAddParser";
import type { Priority, RecurrenceInput } from "@/types/task";

import { DueDateMenu } from "./DueDateMenu";
import { PriorityMenu } from "./PriorityMenu";
import { RecurrenceMenu } from "./RecurrenceMenu";
import { TagPicker } from "./TagPicker";

export interface QuickAddDefaults {
  dueDate?: string;
  priority?: Priority;
  tagIds?: number[];
}

export interface QuickAddProps {
  defaults?: QuickAddDefaults;
  onOpenTask?: (taskId: number) => void;
}

interface QuickAddFormBodyProps {
  defaults: QuickAddDefaults;
  onClose: () => void;
  onOpenTask?: (taskId: number) => void;
  keepOpenAfterCreate: boolean;
}

function QuickAddFormBody({
  defaults,
  onClose,
  onOpenTask,
  keepOpenAfterCreate,
}: Readonly<QuickAddFormBodyProps>) {
  const { createTask } = useTasks();
  const { tags } = useTags();
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority | null>(defaults.priority ?? null);
  const [dueDate, setDueDate] = useState<string | null>(defaults.dueDate ?? null);
  const [recurrence, setRecurrence] = useState<RecurrenceInput>("");
  const [tagIds, setTagIds] = useState<number[]>(defaults.tagIds ?? []);
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => parseQuickAddText(title), [title]);

  const effectiveDueDate = dueDate ?? parsed.dueDate ?? "";
  const effectivePriority: Priority = priority ?? parsed.priority ?? "MEDIUM";
  const effectiveRecurrence: RecurrenceInput = recurrence || parsed.recurrence || "";

  const detectedTagIds = useMemo(() => {
    if (!parsed.tagNames.length) return [];
    const lowerMap = new Map(tags.map((t) => [t.name.toLowerCase(), t.id]));
    return parsed.tagNames
      .map((name) => lowerMap.get(name.toLowerCase()))
      .filter((id): id is number => typeof id === "number");
  }, [parsed.tagNames, tags]);

  const effectiveTagIds = useMemo(
    () => Array.from(new Set([...tagIds, ...detectedTagIds])),
    [detectedTagIds, tagIds]
  );

  const hasParsedHint = Boolean(
    (!dueDate && parsed.dueDate) ||
      (!priority && parsed.priority) ||
      (!recurrence && parsed.recurrence) ||
      detectedTagIds.length > 0
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const finalTitle = (parsed.cleanTitle || title).trim();
    if (!finalTitle || submitting) return;

    setSubmitting(true);
    const created = await createTask(
      {
        title: finalTitle,
        description: description.trim(),
        priority: effectivePriority,
        due_date: effectiveDueDate || null,
        recurrence_rule: effectiveRecurrence || null,
        tag_ids: effectiveTagIds,
      },
      onOpenTask
    );
    setSubmitting(false);

    if (created) {
      setTitle("");
      setDescription("");
      setPriority(defaults.priority ?? null);
      setDueDate(defaults.dueDate ?? null);
      setRecurrence("");
      setTagIds(defaults.tagIds ?? []);
      if (keepOpenAfterCreate) {
        requestAnimationFrame(() => titleInputRef.current?.focus());
      } else {
        onClose();
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      className="rounded-lg border border-line bg-surface dark:bg-surface-2 p-3 shadow-sm"
    >
      <input
        ref={titleInputRef}
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task name (try: Submit report tomorrow !high #work)"
        className="w-full bg-transparent text-[15px] font-medium text-fg outline-none focus:outline-none focus-visible:outline-none placeholder:text-fg-subtle"
        aria-label="Task title"
      />

      <Textarea
        variant="plain"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={1}
        maxHeight={140}
        className="mt-1 py-1 text-[13px] text-fg-muted"
        aria-label="Task description"
      />

      {hasParsedHint ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-fg-subtle">
          <Badge variant="accent" icon={<Sparkles className="size-3" />}>
            Parsed
          </Badge>
          {parsed.cleanTitle ? (
            <span className="truncate">Title: “{parsed.cleanTitle}”</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <DueDateMenu value={effectiveDueDate} onChange={(val) => setDueDate(val)} />
        <PriorityMenu
          value={effectivePriority}
          hasExplicitValue={Boolean(priority || parsed.priority)}
          onChange={(val) => setPriority(val)}
        />
        <RecurrenceMenu
          value={effectiveRecurrence}
          onChange={(val) => setRecurrence(val)}
        />
        <TagPicker
          selectedTagIds={effectiveTagIds}
          onChange={(ids) => setTagIds(ids)}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-subtle pt-2.5">
        <span className="hidden text-[11px] text-fg-subtle sm:inline">
          ↵ to save · esc to cancel
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={submitting}
            disabled={!(parsed.cleanTitle || title).trim()}
          >
            Add task
          </Button>
        </div>
      </div>
    </form>
  );
}

export function QuickAdd({ defaults = {}, onOpenTask }: Readonly<QuickAddProps>) {
  const { quickAddOpen, setQuickAddOpen } = useUI();
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setQuickAddOpen(true)}
          aria-label="Add task"
          className="fixed right-4 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full border border-accent-border bg-accent text-accent-fg shadow-lg transition-transform active:scale-95"
        >
          <Plus className="size-6" aria-hidden="true" />
        </button>
        <Sheet
          open={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          ariaLabel="Create task"
        >
          <div className="p-4">
            <h2 className="mb-3 text-[15px] font-semibold text-fg">New task</h2>
            <QuickAddFormBody
              defaults={defaults}
              onClose={() => setQuickAddOpen(false)}
              onOpenTask={onOpenTask}
              keepOpenAfterCreate={false}
            />
          </div>
        </Sheet>
      </>
    );
  }

  if (!quickAddOpen) {
    return (
      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-line-subtle bg-surface px-3 text-sm text-fg-subtle transition-colors duration-[var(--dur-fast)] hover:border-line hover:text-fg-muted"
      >
        <span className="flex items-center gap-2.5">
          <Plus className="size-4" aria-hidden="true" />
          <span>Add task</span>
        </span>
        <Kbd>C</Kbd>
      </button>
    );
  }

  return (
    <QuickAddFormBody
      defaults={defaults}
      onClose={() => setQuickAddOpen(false)}
      onOpenTask={onOpenTask}
      keepOpenAfterCreate
    />
  );
}

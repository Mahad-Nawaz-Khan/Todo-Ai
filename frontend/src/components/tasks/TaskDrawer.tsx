"use client";

import { Copy, MoreHorizontal, Trash2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { Sheet } from "@/components/ui/Sheet";
import { Textarea } from "@/components/ui/Textarea";
import { useTasks } from "@/context/TasksContext";
import { useUI } from "@/context/UIContext";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useTags } from "@/hooks/useTags";
import {
  extractDateKey,
  formatDetailedTimestamp,
  formatRelativeTimestamp,
} from "@/lib/dates";
import type { Priority, RecurrenceInput, Task } from "@/types/task";

import { TaskCheckbox } from "./TaskCheckbox";
import { TaskProperties } from "./TaskProperties";

interface TaskDrawerFormProps {
  task: Task;
  onCloseForce: () => void;
  requestCloseRef: React.MutableRefObject<() => void>;
}

function sameNumberSets(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

function TaskDrawerForm({ task, onCloseForce, requestCloseRef }: Readonly<TaskDrawerFormProps>) {
  const { updateTask, deleteTask } = useTasks();
  const { tags } = useTags();
  const { confirm } = useUI();

  const initialTagIds = useMemo(() => (task.tags ?? []).map((t) => t.id), [task.tags]);
  const initialDue = extractDateKey(task.due_date) ?? "";
  const initialRecurrence: RecurrenceInput = task.recurrence_rule ?? "";

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [completed, setCompleted] = useState(task.completed);
  const [priority, setPriority] = useState<Priority>(task.priority || "MEDIUM");
  const [dueDate, setDueDate] = useState(initialDue);
  const [recurrence, setRecurrence] = useState<RecurrenceInput>(initialRecurrence);
  const [tagIds, setTagIds] = useState<number[]>(initialTagIds);
  const [saving, setSaving] = useState(false);

  const isDirty = useMemo(() => {
    return (
      title.trim() !== task.title.trim() ||
      description.trim() !== (task.description ?? "").trim() ||
      completed !== task.completed ||
      priority !== (task.priority || "MEDIUM") ||
      dueDate !== initialDue ||
      recurrence !== initialRecurrence ||
      !sameNumberSets(tagIds, initialTagIds)
    );
  }, [
    completed,
    description,
    dueDate,
    initialDue,
    initialRecurrence,
    initialTagIds,
    priority,
    recurrence,
    tagIds,
    task.completed,
    task.description,
    task.priority,
    task.title,
    title,
  ]);

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || saving) return;

    setSaving(true);
    const resolvedTags = tags.filter((tag) => tagIds.includes(tag.id));
    await updateTask(
      task.id,
      {
        title: trimmedTitle,
        description: description.trim(),
        completed,
        priority,
        due_date: dueDate || null,
        recurrence_rule: recurrence || null,
        tag_ids: tagIds,
      },
      resolvedTags
    );
    setSaving(false);
  }, [completed, description, dueDate, priority, recurrence, saving, tagIds, tags, task.id, title, updateTask]);

  const handleDiscard = () => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setCompleted(task.completed);
    setPriority(task.priority || "MEDIUM");
    setDueDate(initialDue);
    setRecurrence(initialRecurrence);
    setTagIds(initialTagIds);
  };

  const handleRequestClose = useCallback(async () => {
    if (!isDirty) {
      onCloseForce();
      return;
    }
    const discard = await confirm({
      title: "Discard unsaved changes?",
      description: "You have edited this task. Discard your changes or keep editing.",
      confirmLabel: "Discard",
      cancelLabel: "Keep editing",
      tone: "danger",
    });
    if (discard) {
      onCloseForce();
    }
  }, [confirm, isDirty, onCloseForce]);

  useEffect(() => {
    requestCloseRef.current = () => {
      void handleRequestClose();
    };
  }, [handleRequestClose, requestCloseRef]);

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete task?",
      description: `“${task.title}” will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (ok) {
      const deleted = await deleteTask(task);
      if (deleted) {
        onCloseForce();
      }
    }
  };

  useHotkeys([
    {
      combo: "mod+enter",
      allowInInput: true,
      when: isDirty,
      handler: () => {
        void handleSave();
      },
    },
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line-subtle px-4">
        <span className="text-xs font-medium text-fg-subtle">
          Task · created {formatRelativeTimestamp(task.created_at)}
        </span>

        <div className="flex items-center gap-1">
          <Menu
            align="end"
            minWidth={170}
            trigger={({ ref, isOpen, toggle }) => (
              <Button
                ref={ref}
                variant="ghost"
                size="icon-sm"
                onClick={toggle}
                aria-expanded={isOpen}
                aria-label="More task actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            )}
          >
            {({ close }) => (
              <>
                <MenuItem
                  icon={<Copy className="size-4" />}
                  label="Copy link"
                  onSelect={() => {
                    close();
                    void navigator.clipboard?.writeText(window.location.href);
                    toast.success("Task link copied");
                  }}
                />
                <MenuSeparator />
                <MenuItem
                  icon={<Trash2 className="size-4" />}
                  label="Delete task"
                  danger
                  onSelect={() => {
                    close();
                    void handleDelete();
                  }}
                />
              </>
            )}
          </Menu>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void handleRequestClose()}
            aria-label="Close task details"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-start gap-2.5">
          <div className="pt-1">
            <TaskCheckbox
              title={title || task.title}
              checked={completed}
              priority={priority}
              onToggle={() => setCompleted((prev) => !prev)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Textarea
              variant="plain"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={1}
              maxHeight={120}
              placeholder="Task title"
              aria-label="Task title"
              className="text-[19px] leading-7 font-semibold tracking-[-0.015em] text-fg"
            />
            <Textarea
              variant="plain"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxHeight={260}
              placeholder="Add notes…"
              aria-label="Task notes"
              className="mt-1.5 text-[15px] leading-6 text-fg-muted"
            />
          </div>
        </div>

        <div className="mt-5">
          <TaskProperties
            completed={completed}
            onCompletedChange={setCompleted}
            priority={priority}
            onPriorityChange={setPriority}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            recurrence={recurrence}
            onRecurrenceChange={setRecurrence}
            tagIds={tagIds}
            onTagIdsChange={setTagIds}
            allTags={tags}
          />
        </div>

        <div className="mt-5 border-t border-line-subtle pt-3 text-xs text-fg-subtle">
          Created {formatDetailedTimestamp(task.created_at)} · Updated{" "}
          {formatRelativeTimestamp(task.updated_at)}
        </div>
      </div>

      {isDirty ? (
        <div className="flex items-center justify-between gap-3 border-t border-line-subtle bg-surface px-5 py-3">
          <span className="flex items-center gap-2 text-xs font-medium text-warning">
            <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
            Unsaved changes
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleDiscard} disabled={saving}>
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={!title.trim()}
              onClick={() => void handleSave()}
              trailingIcon={<Kbd className="border-white/25 bg-white/15 text-white shadow-none">⌘↵</Kbd>}
            >
              Save
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TaskDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tasks } = useTasks();

  const taskParam = searchParams?.get("task") ?? null;
  const taskId = taskParam ? Number(taskParam) : null;
  const task = useMemo(
    () => (taskId && Number.isFinite(taskId) ? tasks.find((t) => t.id === taskId) ?? null : null),
    [taskId, tasks]
  );

  const requestCloseRef = useRef<() => void>(() => {});

  const closeForce = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("task");
    const qs = params.toString();
    const currentPath = pathname ?? "/today";
    router.replace(qs ? `${currentPath}?${qs}` : currentPath, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <Sheet open={Boolean(task)} onClose={() => requestCloseRef.current()} ariaLabel="Task details">
      {task ? (
        <TaskDrawerForm
          key={`${task.id}-${task.updated_at}`}
          task={task}
          onCloseForce={closeForce}
          requestCloseRef={requestCloseRef}
        />
      ) : null}
    </Sheet>
  );
}

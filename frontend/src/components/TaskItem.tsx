"use client";

import { CalendarDays, CheckCircle2, Pencil, Repeat2, Sparkles, Tag as TagIcon, Trash2 } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import type { Priority, RecurrenceInput, Task, TaskUpsertPayload } from "@/types/task";

import TagSelector from "./TagSelector";

type TaskItemProps = {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (deletedTaskId: number) => void;
};

function formatDate(dateString?: string | null) {
  if (!dateString) return "No date";
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function priorityClass(priority: Priority) {
  if (priority === "HIGH") return "priority-high";
  if (priority === "LOW") return "priority-low";
  return "priority-medium";
}

export const TaskItem = memo(function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editPriority, setEditPriority] = useState<Priority>(task.priority || "MEDIUM");
  const [editDueDate, setEditDueDate] = useState(task.due_date || "");
  const [editRecurrenceRule, setEditRecurrenceRule] = useState<RecurrenceInput>(task.recurrence_rule || "");
  const [editTags, setEditTags] = useState<number[]>(task.tags ? task.tags.map((tag) => tag.id) : []);
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    setOptimisticCompleted(task.completed);
  }, [task.completed]);

  const taskStatus = useMemo(() => {
    if (optimisticCompleted) return "Completed";
    if (task.due_date && new Date(task.due_date).getTime() < Date.now()) return "Overdue";
    return "Open";
  }, [optimisticCompleted, task.due_date]);

  const handleToggleComplete = async () => {
    setError(null);
    const previousCompleted = task.completed;
    const nextCompleted = !task.completed;

    setOptimisticCompleted(nextCompleted);
    onUpdate({ ...task, completed: nextCompleted, updated_at: new Date().toISOString() });
    setLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks/${task.id}/toggle-completion`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { detail?: string };
        throw new Error(errorData.detail || `Failed to update task: ${response.status}`);
      }

      const updatedTask = (await response.json()) as Task;
      setOptimisticCompleted(Boolean(updatedTask.completed ?? previousCompleted));
      onUpdate(updatedTask);
      toast.success(updatedTask.completed ? "Task completed" : "Task reopened");
    } catch (err) {
      setOptimisticCompleted(previousCompleted);
      onUpdate({ ...task, completed: previousCompleted });
      const message = err instanceof Error ? err.message : "Failed to update task";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: TaskUpsertPayload = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      due_date: editDueDate || null,
      recurrence_rule: editRecurrenceRule || null,
      tag_ids: editTags,
    };

    const previousTask = task;
    onUpdate({
      ...task,
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      due_date: payload.due_date,
      recurrence_rule: payload.recurrence_rule,
      tags: (task.tags || []).filter((tag) => payload.tag_ids.includes(tag.id)),
      updated_at: new Date().toISOString(),
    });
    setIsEditing(false);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { detail?: string };
        throw new Error(errorData.detail || `Failed to update task: ${response.status}`);
      }

      const updatedTask = (await response.json()) as Task;
      onUpdate(updatedTask);
      toast.success("Task updated");
    } catch (err) {
      onUpdate(previousTask);
      setIsEditing(true);
      const message = err instanceof Error ? err.message : "Failed to update task";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks/${task.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { detail?: string };
        throw new Error(errorData.detail || `Failed to delete task: ${response.status}`);
      }

      onDelete(task.id);
      toast.success("Task deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete task";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article
      className={`content-auto task-card-contain card-lift section-card animate-fade-in-up-sm rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 ${optimisticCompleted ? "border-[rgba(126,240,184,0.18)] bg-[rgba(126,240,184,0.06)] shadow-[0_0_0_1px_rgba(126,240,184,0.05),0_16px_40px_rgba(126,240,184,0.08)]" : ""}`}
    >
      {error ? (
        <div className="error-banner mb-4 rounded-2xl border border-[rgba(255,135,124,0.24)] bg-[rgba(255,135,124,0.08)] px-4 py-3 text-sm text-[#ffd4cf]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`status-pill rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${priorityClass(task.priority)}`}>
              {task.priority}
            </span>
            <span className="status-pill rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em]">{taskStatus}</span>
          </div>
          <div className="mt-4 flex items-start gap-3">
            <button
              type="button"
              onClick={handleToggleComplete}
              disabled={loading}
              className={`mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl border transition active:scale-[0.92] sm:size-12 ${
                optimisticCompleted
                  ? "animate-check-bounce border-[rgba(126,240,184,0.24)] bg-[rgba(126,240,184,0.12)] text-[var(--success)] shadow-[0_10px_30px_rgba(126,240,184,0.12)]"
                  : "border-white/10 bg-white/6 text-[var(--text-dim)] hover:border-white/14 hover:text-white"
              }`}
            >
              <CheckCircle2 className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h3 className={`text-lg font-semibold tracking-[-0.03em] ${optimisticCompleted ? "text-[rgba(255,255,255,0.58)] line-through" : "text-white"}`}>
                {task.title}
              </h3>
              {task.description ? <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{task.description}</p> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => {
              setEditTitle(task.title);
              setEditDescription(task.description || "");
              setEditPriority(task.priority || "MEDIUM");
              setEditDueDate(task.due_date || "");
              setEditRecurrenceRule(task.recurrence_rule || "");
              setEditTags(task.tags ? task.tags.map((tag) => tag.id) : []);
              setIsEditing(true);
            }}
            className="btn-press action-button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm"
            disabled={loading}
          >
            <Pencil className="size-4" /> Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-press inline-flex items-center gap-2 rounded-2xl border border-[rgba(255,135,124,0.2)] bg-[rgba(255,135,124,0.08)] px-4 py-2 text-sm text-[#ffd4cf] transition hover:bg-[rgba(255,135,124,0.12)]"
            disabled={loading}
          >
            <Trash2 className="size-4" /> Delete
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--text-dim)]">
        <span className="status-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5">
          <CalendarDays className="size-3.5" /> {formatDate(task.due_date)}
        </span>
        {task.recurrence_rule ? (
          <span className="status-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5">
            <Repeat2 className="size-3.5" /> {task.recurrence_rule}
          </span>
        ) : null}
        <span className="status-pill rounded-full px-3 py-1.5">Created {formatDate(task.created_at)}</span>
      </div>

      {task.tags && task.tags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <span key={tag.id} className="tag-pill rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-secondary)]">
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}

      {isEditing ? (
        <form
          onSubmit={handleUpdate}
          className="animate-expand mt-6 overflow-hidden rounded-[24px] border border-white/8 bg-black/16 p-4"
        >
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Title</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input-shell min-w-0 w-full rounded-2xl px-4 py-3" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="input-shell min-w-0 w-full min-h-[120px] rounded-2xl px-4 py-3" rows={4} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <Sparkles className="size-4 text-[var(--accent-ice)]" /> Priority
                </label>
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)} className="input-shell min-w-0 w-full rounded-2xl px-4 py-3">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <CalendarDays className="size-4 text-[var(--accent-amber)]" /> Due date
                </label>
                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="input-shell min-w-0 w-full rounded-2xl px-4 py-3" />
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <Repeat2 className="size-4 text-[var(--accent-lime)]" /> Recurrence
              </label>
              <select value={editRecurrenceRule} onChange={(e) => setEditRecurrenceRule(e.target.value as RecurrenceInput)} className="input-shell min-w-0 w-full rounded-2xl px-4 py-3">
                <option value="">No recurrence</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <TagIcon className="size-4 text-[var(--accent-blue)]" /> Tags
              </div>
              <TagSelector selectedTags={editTags} onTagsChange={setEditTags} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={loading} className="btn-press action-button-primary rounded-2xl px-5 py-3 text-sm">
                {loading ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="btn-press action-button-secondary rounded-2xl px-5 py-3 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </article>
  );
});

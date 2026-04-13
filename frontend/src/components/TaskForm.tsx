"use client";

import { CalendarDays, Plus, Repeat2, Sparkles, Tag as TagIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import type { Priority, RecurrenceInput, Task, TaskUpsertPayload } from "@/types/task";

import TagSelector from "./TagSelector";

type TaskFormProps = {
  onTaskCreated?: (newTask: Task) => void;
};

export const TaskForm = ({ onTaskCreated }: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceInput>("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("todo:open-task-form", handleOpen);
    return () => window.removeEventListener("todo:open-task-form", handleOpen);
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setDueDate("");
    setRecurrenceRule("");
    setSelectedTags([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    const payload: TaskUpsertPayload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      recurrence_rule: recurrenceRule || null,
      tag_ids: selectedTags,
    };

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { detail?: string };
        throw new Error(errorData.detail || `Failed to create task: ${response.status}`);
      }

      const newTask = (await response.json()) as Task;
      resetForm();
      setIsOpen(false);
      onTaskCreated?.(newTask);
      toast.success("Task created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create task";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-card rounded-[28px] p-5 sm:p-6">
      <button type="button" onClick={() => setIsOpen((value) => !value)} className="flex w-full items-start justify-between gap-4 text-left">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">Quick capture</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Create a new task</h3>
          <p className="mt-2 max-w-md text-sm text-[var(--text-dim)]">
            Capture work instantly with priority, due date, recurrence, and tags.
          </p>
        </div>
        <span className="action-button-primary btn-press inline-flex size-12 items-center justify-center rounded-2xl">
          <Plus className="size-5" />
        </span>
      </button>

      {isOpen ? (
        <form
          onSubmit={handleSubmit}
          className="animate-expand overflow-hidden"
        >
          {error ? (
            <div className="error-banner mt-5 rounded-2xl border border-[rgba(255,135,124,0.24)] bg-[rgba(255,135,124,0.08)] px-4 py-3 text-sm text-[#ffd4cf]">
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ship the new mobile dashboard"
                className="input-shell min-w-0 w-full rounded-2xl px-4 py-3"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional context, checklist hints, or implementation notes"
                className="input-shell min-w-0 min-h-[120px] w-full rounded-2xl px-4 py-3"
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="priority" className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <Sparkles className="size-4 text-[var(--accent-ice)]" /> Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="input-shell min-w-0 w-full rounded-2xl px-4 py-3"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="dueDate" className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <CalendarDays className="size-4 text-[var(--accent-amber)]" /> Due date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-shell min-w-0 w-full rounded-2xl px-4 py-3"
                />
              </div>
            </div>

            <div>
              <label htmlFor="recurrenceRule" className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <Repeat2 className="size-4 text-[var(--accent-lime)]" /> Recurrence
              </label>
              <select
                id="recurrenceRule"
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceInput)}
                className="input-shell min-w-0 w-full rounded-2xl px-4 py-3"
              >
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
              <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={loading} className="btn-press action-button-primary rounded-2xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Creating task..." : "Create task"}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-press action-button-secondary rounded-2xl px-5 py-3 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  );
};

"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import TagSelector from './TagSelector';

export const TaskItem = ({ task, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'MEDIUM');
  const [editDueDate, setEditDueDate] = useState(task.due_date || '');
  const [editRecurrenceRule, setEditRecurrenceRule] = useState(task.recurrence_rule || '');
  const [editTags, setEditTags] = useState(task.tags ? task.tags.map(tag => tag.id) : []);
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();

  useEffect(() => {
    setOptimisticCompleted(task.completed);
  }, [task.completed]);

  const handleToggleComplete = async () => {
    setError(null);

    const previousCompleted = task.completed;
    const nextCompleted = !task.completed;

    // Optimistic update
    setOptimisticCompleted(nextCompleted);
    onUpdate({
      ...task,
      completed: nextCompleted,
      updated_at: new Date().toISOString(),
    });

    setLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks/${task.id}/toggle-completion`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update task: ${response.status}`);
      }

      const updatedTask = await response.json();
      // Update with the server response (authoritative state)
      setOptimisticCompleted(Boolean(updatedTask?.completed ?? previousCompleted));
      onUpdate(updatedTask);
    } catch (err) {
      // Revert on error
      setOptimisticCompleted(previousCompleted);
      onUpdate({ ...task, completed: previousCompleted });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
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
      tags: (task.tags || []).filter((tag) => payload.tag_ids?.includes(tag.id)),
      updated_at: new Date().toISOString(),
    });
    setIsEditing(false);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update task: ${response.status}`);
      }

      const updatedTask = await response.json();
      onUpdate(updatedTask);
    } catch (err) {
      onUpdate(previousTask);
      setIsEditing(true);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete task: ${response.status}`);
      }

      onDelete(task.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
        {error && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            Error: {error}
          </div>
        )}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              required
            />
          </div>
          <div>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="mt-1 w-full cursor-pointer rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 hover:bg-white/15"
              >
                <option value="LOW" className="bg-slate-950 text-white">Low</option>
                <option value="MEDIUM" className="bg-slate-950 text-white">Medium</option>
                <option value="HIGH" className="bg-slate-950 text-white">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80">Due Date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80">Recurrence</label>
            <select
              value={editRecurrenceRule}
              onChange={(e) => setEditRecurrenceRule(e.target.value)}
              className="mt-1 w-full cursor-pointer rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 hover:bg-white/15"
            >
              <option value="" className="bg-slate-950 text-white">No recurrence</option>
              <option value="DAILY" className="bg-slate-950 text-white">Daily</option>
              <option value="WEEKLY" className="bg-slate-950 text-white">Weekly</option>
              <option value="MONTHLY" className="bg-slate-950 text-white">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80">Tags</label>
            <TagSelector
              selectedTags={editTags}
              onTagsChange={setEditTags}
              taskId={task.id}
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/15"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-5 shadow-lg ${optimisticCompleted ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
        Error: {error}
      </div>
      )}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={optimisticCompleted}
            onChange={handleToggleComplete}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10"
            disabled={loading}
          />
          <div>
            <h3 className={`text-base font-semibold ${optimisticCompleted ? 'line-through text-emerald-100/80' : 'text-white'}`}>{task.title}</h3>
            {task.description && (
              <div className="mt-1 text-sm text-white/70">
                {task.description}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditTitle(task.title);
              setEditDescription(task.description || '');
              setEditPriority(task.priority || 'MEDIUM');
              setEditDueDate(task.due_date || '');
              setEditRecurrenceRule(task.recurrence_rule || '');
              setEditTags(task.tags ? task.tags.map(tag => tag.id) : []);
              setIsEditing(true);
            }}
            className="text-sm font-medium text-blue-300 hover:text-blue-200"
            disabled={loading}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-sm font-medium text-red-300 hover:text-red-200"
            disabled={loading}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/70">
        <div>
          Priority: <span className="font-medium text-white">{task.priority}</span>
        </div>
        {task.due_date && (
          <div>
            Due: <span className="font-medium text-white">{formatDate(task.due_date)}</span>
          </div>
        )}
        {task.recurrence_rule && (
          <div>
            Recurs: <span className="font-medium text-white capitalize">{task.recurrence_rule}</span>
          </div>
        )}
        <div>
          Created: <span className="font-medium text-white">{formatDate(task.created_at)}</span>
        </div>

        {/* Display tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="sm:col-span-2 mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-white/60">Tags</span>
            {task.tags.map(tag => (
              <span key={tag.id} className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/80">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
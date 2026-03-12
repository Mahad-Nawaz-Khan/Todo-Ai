"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { TaskItem } from './TaskItem';
import { useAuth } from '@clerk/nextjs';

export const TaskList = ({ createdTask }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    completed: null,
    priority: '',
    search: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const [sortConfig, setSortConfig] = useState({
    sortBy: 'created_at',
    order: 'desc'
  });
  const { getToken } = useAuth();
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetchTasksFromAPI();
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const handleTagsChanged = (event) => {
      const detail = event?.detail;
      if (!detail) {
        return;
      }

      if (detail.type === 'updated' && detail.tag) {
        const updatedTag = detail.tag;
        setTasks((prev) => prev.map((task) => {
          if (!Array.isArray(task.tags) || task.tags.length === 0) {
            return task;
          }

          let changed = false;
          const nextTags = task.tags.map((tag) => {
            if (tag.id !== updatedTag.id) {
              return tag;
            }
            changed = true;
            return {
              ...tag,
              ...updatedTag,
            };
          });

          if (!changed) {
            return task;
          }

          return {
            ...task,
            tags: nextTags,
          };
        }));
      }

      if (detail.type === 'deleted' && detail.tagId) {
        const deletedTagId = detail.tagId;
        setTasks((prev) => prev.map((task) => {
          if (!Array.isArray(task.tags) || task.tags.length === 0) {
            return task;
          }

          const nextTags = task.tags.filter((tag) => tag.id !== deletedTagId);
          if (nextTags.length === task.tags.length) {
            return task;
          }

          return {
            ...task,
            tags: nextTags,
          };
        }));
      }
    };

    window.addEventListener('tags:changed', handleTagsChanged);
    return () => window.removeEventListener('tags:changed', handleTagsChanged);
  }, []);

  // Listen for tasks updated event from chat bot
  useEffect(() => {
    const handleTasksUpdated = () => {
      fetchTasksFromAPI({ replace: true });
    };

    window.addEventListener('tasksUpdated', handleTasksUpdated);
    return () => window.removeEventListener('tasksUpdated', handleTasksUpdated);
  }, []);

  useEffect(() => {
    const normalizedSearch = searchInput.trim();
    const timeout = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === normalizedSearch) {
          return prev;
        }
        return {
          ...prev,
          search: normalizedSearch,
        };
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!createdTask || !createdTask.id) {
      return;
    }

    setTasks((prev) => {
      if (prev.some((task) => task.id === createdTask.id)) {
        return prev;
      }
      return [createdTask, ...prev];
    });
  }, [createdTask]);

  const visibleTasks = useMemo(() => {
    let result = tasks;

    if (filters.completed !== null) {
      result = result.filter((task) => task.completed === filters.completed);
    }

    if (filters.priority) {
      result = result.filter((task) => task.priority === filters.priority);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter((task) => {
        const tagNames = Array.isArray(task.tags) ? task.tags.map((tag) => tag.name).join(' ') : '';
        const haystack = `${task.title ?? ''} ${task.description ?? ''} ${tagNames}`.toLowerCase();
        return haystack.includes(query);
      });
    }

    const direction = sortConfig.order === 'asc' ? 1 : -1;
    const priorityRank = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };

    const sorted = [...result].sort((a, b) => {
      if (sortConfig.sortBy === 'priority') {
        const aRank = priorityRank[a.priority] ?? 0;
        const bRank = priorityRank[b.priority] ?? 0;
        return (aRank - bRank) * direction;
      }

      if (sortConfig.sortBy === 'due_date') {
        const aDate = a.due_date ? Date.parse(a.due_date) : null;
        const bDate = b.due_date ? Date.parse(b.due_date) : null;

        if (aDate === null && bDate === null) {
          return 0;
        }
        if (aDate === null) {
          return 1;
        }
        if (bDate === null) {
          return -1;
        }

        return (aDate - bDate) * direction;
      }

      const aTime = a[sortConfig.sortBy] ? Date.parse(a[sortConfig.sortBy]) : 0;
      const bTime = b[sortConfig.sortBy] ? Date.parse(b[sortConfig.sortBy]) : 0;
      return (aTime - bTime) * direction;
    });

    return sorted;
  }, [tasks, filters, sortConfig]);

  const fetchTasksFromAPI = async (options = {}) => {
    const { replace = false } = options; // If true, replace tasks instead of merging
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setError(null);
      setLoading(true);
      const token = await getToken();

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const pageSize = 100;
      let offset = 0;
      let allTasks = [];

      while (true) {
        const params = new URLSearchParams();
        params.append('limit', pageSize.toString());
        params.append('offset', offset.toString());
        params.append('sort_by', 'created_at');
        params.append('order', 'desc');

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.status}`);
        }

        const page = await response.json();
        if (requestIdRef.current !== requestId) {
          return;
        }

        allTasks = allTasks.concat(page);

        if (!Array.isArray(page) || page.length < pageSize) {
          break;
        }

        offset += pageSize;
      }

      if (replace) {
        // Replace tasks entirely (used for refresh after chat operations)
        setTasks(allTasks);
      } else {
        // Merge with existing tasks (used for initial load)
        setTasks((prev) => {
          const byId = new Map();
          for (const task of allTasks) {
            byId.set(task.id, task);
          }
          for (const task of prev) {
            if (!byId.has(task.id)) {
              byId.set(task.id, task);
            }
          }
          return Array.from(byId.values());
        });
      }
    } catch (err) {
      if (requestIdRef.current !== requestId) {
        return;
      }
      if (err?.name === 'AbortError') {
        return;
      }
      setError(err?.message || 'Failed to fetch tasks');
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks((prev) => {
      const index = prev.findIndex((task) => task.id === updatedTask.id);

      if (index === -1) {
        return [updatedTask, ...prev];
      }

      const next = [...prev];
      next[index] = updatedTask;
      return next;
    });
  };

  const handleTaskDelete = (deletedTaskId) => {
    setTasks((prev) => prev.filter(task => task.id !== deletedTaskId));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSortChange = (sortBy) => {
    setSortConfig(prev => ({
      sortBy,
      order: prev.sortBy === sortBy && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Your Tasks</h2>
          <p className="mt-1 text-sm text-white/70">Filter, sort, and search across your tasks.</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="mt-4 text-sm text-white/70">Loading tasks...</div>
      )}

      <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/80">Status</label>
          <select
            value={filters.completed === null ? '' : filters.completed.toString()}
            onChange={(e) => handleFilterChange('completed', e.target.value === '' ? null : e.target.value === 'true')}
            className="mt-1 w-full cursor-pointer rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 hover:bg-white/15"
          >
            <option value="" className="bg-slate-950 text-white">All</option>
            <option value="false" className="bg-slate-950 text-white">Active</option>
            <option value="true" className="bg-slate-950 text-white">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="mt-1 w-full cursor-pointer rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 hover:bg-white/15"
          >
            <option value="" className="bg-slate-950 text-white">All</option>
            <option value="HIGH" className="bg-slate-950 text-white">High</option>
            <option value="MEDIUM" className="bg-slate-950 text-white">Medium</option>
            <option value="LOW" className="bg-slate-950 text-white">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80">Sort By</label>
          <select
            value={sortConfig.sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="mt-1 w-full cursor-pointer rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40 hover:bg-white/15"
          >
            <option value="created_at" className="bg-slate-950 text-white">Created Date</option>
            <option value="updated_at" className="bg-slate-950 text-white">Updated Date</option>
            <option value="due_date" className="bg-slate-950 text-white">Due Date</option>
            <option value="priority" className="bg-slate-950 text-white">Priority</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80">Search</label>
          <input
            type="text"
            placeholder="Search tasks or tags..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          />
        </div>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-6">
          <div className="font-medium text-white">{loading ? 'Loading tasks...' : 'No tasks found'}</div>
          {!loading && tasks.length === 0 && (
            <div className="mt-1 text-sm text-white/70">Create your first task using the form on the right.</div>
          )}
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {visibleTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
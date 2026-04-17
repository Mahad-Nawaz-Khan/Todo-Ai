"use client";

import { ListFilter, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useDeferredValue, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import type { TagsChangedDetail } from "@/types/events";
import type { Priority, Task } from "@/types/task";

import { CustomSelect } from "./CustomSelect";
import { TaskItem } from "./TaskItem";
import TaskInsights from "./TaskInsights";

type TaskListProps = {
  createdTask?: Task | null;
};

type TaskFilters = {
  completed: boolean | null;
  priority: "" | Priority;
  search: string;
};

type SortConfig = {
  sortBy: "created_at" | "updated_at" | "due_date" | "priority";
  order: "asc" | "desc";
};

export const TaskList = ({ createdTask = null }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({ completed: null, priority: "", search: "" });
  const [searchInput, setSearchInput] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ sortBy: "created_at", order: "desc" });
  const [showControls, setShowControls] = useState(true);
  const { getToken } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const fetchTasksFromAPI = useCallback(
    async (options: { replace?: boolean } = {}) => {
      const { replace = false } = options;
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
        let allTasks: Task[] = [];

        while (true) {
          const params = new URLSearchParams();
          params.append("limit", pageSize.toString());
          params.append("offset", offset.toString());
          params.append("sort_by", "created_at");
          params.append("order", "desc");

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tasks?${params.toString()}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: abortController.signal,
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch tasks: ${response.status}`);
          }

          const page = (await response.json()) as Task[];
          if (requestIdRef.current !== requestId) return;

          allTasks = allTasks.concat(page);
          if (!Array.isArray(page) || page.length < pageSize) break;
          offset += pageSize;
        }

        if (replace) {
          setTasks(allTasks);
        } else {
          setTasks((prev) => {
            const byId = new Map<number, Task>();
            for (const task of allTasks) byId.set(task.id, task);
            for (const task of prev) {
              if (!byId.has(task.id)) byId.set(task.id, task);
            }
            return Array.from(byId.values());
          });
        }
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to fetch tasks");
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [getToken]
  );

  useEffect(() => {
    void fetchTasksFromAPI();
  }, [fetchTasksFromAPI]);

  useEffect(() => {
    const handleTasksUpdated = () => {
      void fetchTasksFromAPI({ replace: true });
    };

    window.addEventListener("tasksUpdated", handleTasksUpdated);
    return () => window.removeEventListener("tasksUpdated", handleTasksUpdated);
  }, [fetchTasksFromAPI]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    const handleTagsChanged = (event: Event) => {
      const detail = (event as CustomEvent<TagsChangedDetail>).detail;
      if (!detail) return;

      if (detail.type === "updated") {
        const updatedTag = detail.tag;
        setTasks((prev) =>
          prev.map((task) => {
            if (!Array.isArray(task.tags) || !task.tags.length) return task;
            let changed = false;
            const nextTags = task.tags.map((tag) => {
              if (tag.id !== updatedTag.id) return tag;
              changed = true;
              return { ...tag, ...updatedTag };
            });
            return changed ? { ...task, tags: nextTags } : task;
          })
        );
      }

      if (detail.type === "deleted") {
        const deletedTagId = detail.tagId;
        setTasks((prev) =>
          prev.map((task) => {
            if (!Array.isArray(task.tags) || !task.tags.length) return task;
            const nextTags = task.tags.filter((tag) => tag.id !== deletedTagId);
            return nextTags.length === task.tags.length ? task : { ...task, tags: nextTags };
          })
        );
      }
    };

    window.addEventListener("tags:changed", handleTagsChanged);
    return () => window.removeEventListener("tags:changed", handleTagsChanged);
  }, []);

  useEffect(() => {
    const normalizedSearch = searchInput.trim();
    const timeout = setTimeout(() => {
      setFilters((prev) => (prev.search === normalizedSearch ? prev : { ...prev, search: normalizedSearch }));
    }, 280);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!createdTask?.id) return;
    setTasks((prev) => (prev.some((task) => task.id === createdTask.id) ? prev : [createdTask, ...prev]));
  }, [createdTask]);

  const deferredFilters = useDeferredValue(filters);
  const deferredSort = useDeferredValue(sortConfig);

  const visibleTasks = useMemo(() => {
    let result = tasks;

    if (deferredFilters.completed !== null) {
      result = result.filter((task) => task.completed === deferredFilters.completed);
    }

    if (deferredFilters.priority) {
      result = result.filter((task) => task.priority === deferredFilters.priority);
    }

    if (deferredFilters.search) {
      const query = deferredFilters.search.toLowerCase();
      result = result.filter((task) => {
        const tagNames = Array.isArray(task.tags) ? task.tags.map((tag) => tag.name).join(" ") : "";
        const haystack = `${task.title ?? ""} ${task.description ?? ""} ${tagNames}`.toLowerCase();
        return haystack.includes(query);
      });
    }

    const direction = deferredSort.order === "asc" ? 1 : -1;
    const priorityRank: Record<Priority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };

    return [...result].sort((a, b) => {
      if (deferredSort.sortBy === "priority") {
        return ((priorityRank[a.priority] ?? 0) - (priorityRank[b.priority] ?? 0)) * direction;
      }

      if (deferredSort.sortBy === "due_date") {
        const aDate = a.due_date ? Date.parse(a.due_date) : null;
        const bDate = b.due_date ? Date.parse(b.due_date) : null;
        if (aDate === null && bDate === null) return 0;
        if (aDate === null) return 1;
        if (bDate === null) return -1;
        return (aDate - bDate) * direction;
      }

      const aTime = a[deferredSort.sortBy] ? Date.parse(a[deferredSort.sortBy] as string) : 0;
      const bTime = b[deferredSort.sortBy] ? Date.parse(b[deferredSort.sortBy] as string) : 0;
      return (aTime - bTime) * direction;
    });
  }, [deferredFilters, deferredSort, tasks]);

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks((prev) => {
      const index = prev.findIndex((task) => task.id === updatedTask.id);
      if (index === -1) return [updatedTask, ...prev];
      const next = [...prev];
      next[index] = updatedTask;
      return next;
    });
  }, []);

  const handleTaskDelete = useCallback((deletedTaskId: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== deletedTaskId));
  }, []);

  const handleFilterChange = <K extends keyof TaskFilters>(filterName: K, value: TaskFilters[K]) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleSortChange = (sortBy: SortConfig["sortBy"]) => {
    setSortConfig((prev) => ({
      sortBy,
      order: prev.sortBy === sortBy && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <section className="space-y-4">
      <TaskInsights tasks={tasks} />

      <div className="section-card rounded-[30px] p-4 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-(--text-faint)">Task board</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Your active workspace</h2>
            <p className="mt-2 text-sm text-(--text-dim)">Filter, sort, and edit tasks while keeping the backend contract untouched.</p>
          </div>
          <button type="button" onClick={() => setShowControls((value) => !value)} className="action-button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm">
            <SlidersHorizontal className="size-4" /> {showControls ? "Hide controls" : "Show controls"}
          </button>
        </div>

        {error ? (
          <div className="error-banner mt-5 rounded-2xl border border-[rgba(255,135,124,0.24)] bg-[rgba(255,135,124,0.08)] px-4 py-3 text-sm text-[#ffd4cf]">
            {error}
          </div>
        ) : null}

        <label className="mt-4 flex items-center gap-3 rounded-[24px] border border-white/8 bg-white/4 px-4 py-3 md:mt-5">
          <Search className="size-4 text-(--text-faint)" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search titles, notes, and tags"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-(--text-faint)"
          />
        </label>

        {showControls ? (
          <div className="animate-expand mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-3">
              <span className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-(--text-faint)">
                <ListFilter className="size-3.5" /> Status
              </span>
              <CustomSelect
                value={filters.completed === null ? "" : filters.completed ? "done" : "open"}
                onChange={(value) => handleFilterChange("completed", value === "" ? null : value === "done")}
                options={[
                  { value: "", label: "All" },
                  { value: "open", label: "Open" },
                  { value: "done", label: "Completed" },
                ]}
              />
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-3">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-(--text-faint)">Priority</span>
              <CustomSelect
                value={filters.priority}
                onChange={(value) => handleFilterChange("priority", value as TaskFilters["priority"])}
                options={[
                  { value: "", label: "All" },
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                ]}
              />
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-3">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-(--text-faint)">Sort</span>
              <CustomSelect
                value={sortConfig.sortBy}
                onChange={(value) => handleSortChange(value as SortConfig["sortBy"])}
                options={[
                  { value: "created_at", label: "Created" },
                  { value: "updated_at", label: "Updated" },
                  { value: "due_date", label: "Due date" },
                  { value: "priority", label: "Priority" },
                ]}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 space-y-4 stagger-tasks">
          {loading ? (
            <div className="animate-fade-in flex items-center gap-3 text-sm text-(--text-dim)">
              <div className="animate-shimmer size-5 rounded-full border border-white/10 bg-white/6" />
              Loading tasks...
            </div>
          ) : null}
          {!loading && !visibleTasks.length ? (
            <div className="animate-fade-in-up-sm rounded-[26px] border border-dashed border-white/10 bg-black/18 p-8 text-sm text-(--text-dim)">
              No tasks matched the current filters.
            </div>
          ) : null}
          {visibleTasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} />
          ))}
        </div>
      </div>
    </section>
  );
};

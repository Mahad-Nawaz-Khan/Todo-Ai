"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { computeSidebarCounts, type SidebarCounts } from "@/lib/taskViews";
import {
  createTaskRequest,
  deleteTaskRequest,
  fetchAllTasks,
  toggleTaskCompletionRequest,
  updateTaskRequest,
  type TaskUpdatePayload,
} from "@/services/taskApi";
import type { TagsChangedDetail } from "@/types/events";
import type { Tag } from "@/types/tag";
import type { Task, TaskUpsertPayload } from "@/types/task";

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  pendingIds: Set<number>;
  counts: SidebarCounts;
  refreshTasks: () => Promise<void>;
  createTask: (payload: TaskUpsertPayload, onOpenTask?: (taskId: number) => void) => Promise<Task | null>;
  updateTask: (taskId: number, payload: TaskUpdatePayload, resolvedTags?: Tag[]) => Promise<Task | null>;
  toggleTask: (task: Task, allowUndo?: boolean) => Promise<void>;
  deleteTask: (task: Task) => Promise<boolean>;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

function applyTagUpdate(tasks: Task[], updatedTag: Tag): Task[] {
  return tasks.map((task) => {
    if (!task.tags?.length) return task;
    let changed = false;
    const nextTags = task.tags.map((tag) => {
      if (tag.id !== updatedTag.id) return tag;
      changed = true;
      return { ...tag, ...updatedTag };
    });
    return changed ? { ...task, tags: nextTags } : task;
  });
}

function applyTagDeletion(tasks: Task[], deletedTagId: number): Task[] {
  return tasks.map((task) => {
    if (!task.tags?.length) return task;
    const nextTags = task.tags.filter((tag) => tag.id !== deletedTagId);
    return nextTags.length === task.tags.length ? task : { ...task, tags: nextTags };
  });
}

export function TasksProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<number>>(() => new Set());
  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const setPending = useCallback((taskId: number, active: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (active) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }, []);

  const refreshTasks = useCallback(async () => {
    if (!isSignedIn) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const reqId = reqIdRef.current + 1;
    reqIdRef.current = reqId;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        setTasks([]);
        return;
      }
      const fetched = await fetchAllTasks(token, controller.signal);
      if (reqIdRef.current !== reqId) return;
      setTasks(fetched);
    } catch (err) {
      if (reqIdRef.current !== reqId) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      if (reqIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refreshTasks();
    return () => abortRef.current?.abort();
  }, [isLoaded, isSignedIn, refreshTasks]);

  useEffect(() => {
    const onTasksUpdated = () => {
      void refreshTasks();
    };
    const onTagsChanged = (event: Event) => {
      const detail = (event as CustomEvent<TagsChangedDetail>).detail;
      if (!detail) return;
      if (detail.type === "updated") {
        setTasks((prev) => applyTagUpdate(prev, detail.tag));
      } else if (detail.type === "deleted") {
        setTasks((prev) => applyTagDeletion(prev, detail.tagId));
      }
    };

    window.addEventListener("tasksUpdated", onTasksUpdated);
    window.addEventListener("tags:changed", onTagsChanged);
    return () => {
      window.removeEventListener("tasksUpdated", onTasksUpdated);
      window.removeEventListener("tags:changed", onTagsChanged);
    };
  }, [refreshTasks]);

  const createTask = useCallback(
    async (payload: TaskUpsertPayload, onOpenTask?: (taskId: number) => void): Promise<Task | null> => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Please sign in to create tasks");
        const created = await createTaskRequest(token, payload);
        setTasks((prev) => (prev.some((t) => t.id === created.id) ? prev : [created, ...prev]));
        toast.success("Task created", {
          action: onOpenTask
            ? { label: "View", onClick: () => onOpenTask(created.id) }
            : undefined,
        });
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create task";
        toast.error(message);
        return null;
      }
    },
    [getToken]
  );

  const updateTask = useCallback(
    async (taskId: number, payload: TaskUpdatePayload, resolvedTags?: Tag[]): Promise<Task | null> => {
      const previous = tasks.find((t) => t.id === taskId);
      if (!previous) return null;

      const optimistic: Task = {
        ...previous,
        ...payload,
        description: payload.description !== undefined ? payload.description : previous.description,
        tags: resolvedTags ?? previous.tags,
        updated_at: new Date().toISOString(),
      };

      setTasks((prev) => prev.map((t) => (t.id === taskId ? optimistic : t)));
      setPending(taskId, true);

      try {
        const token = await getToken();
        if (!token) throw new Error("Please sign in to update tasks");
        const saved = await updateTaskRequest(token, taskId, payload);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? saved : t)));
        toast.success("Task updated");
        return saved;
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? previous : t)));
        toast.error(err instanceof Error ? err.message : "Failed to update task");
        return null;
      } finally {
        setPending(taskId, false);
      }
    },
    [getToken, setPending, tasks]
  );

  const toggleTask = useCallback(
    async (task: Task, allowUndo = true) => {
      const nextCompleted = !task.completed;
      const optimistic: Task = {
        ...task,
        completed: nextCompleted,
        updated_at: new Date().toISOString(),
      };

      setTasks((prev) => prev.map((t) => (t.id === task.id ? optimistic : t)));
      setPending(task.id, true);

      try {
        const token = await getToken();
        if (!token) throw new Error("Please sign in to update tasks");
        const updated = await toggleTaskCompletionRequest(token, task.id);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));

        if (task.recurrence_rule && updated.completed) {
          void refreshTasks();
        }

        if (allowUndo) {
          toast.success(updated.completed ? "Task completed" : "Task reopened", {
            duration: 5000,
            action: {
              label: "Undo",
              onClick: () => {
                void toggleTask(updated, false);
              },
            },
          });
        }
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        toast.error(err instanceof Error ? err.message : "Failed to update task");
      } finally {
        setPending(task.id, false);
      }
    },
    [getToken, refreshTasks, setPending]
  );

  const deleteTask = useCallback(
    async (task: Task): Promise<boolean> => {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setPending(task.id, true);

      try {
        const token = await getToken();
        if (!token) throw new Error("Please sign in to delete tasks");
        await deleteTaskRequest(token, task.id);
        toast.success("Task deleted");
        return true;
      } catch (err) {
        setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [task, ...prev]));
        toast.error(err instanceof Error ? err.message : "Failed to delete task");
        return false;
      } finally {
        setPending(task.id, false);
      }
    },
    [getToken, setPending]
  );

  const counts = useMemo(() => computeSidebarCounts(tasks), [tasks]);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      loading,
      error,
      pendingIds,
      counts,
      refreshTasks,
      createTask,
      updateTask,
      toggleTask,
      deleteTask,
    }),
    [counts, createTask, deleteTask, error, loading, pendingIds, refreshTasks, tasks, toggleTask, updateTask]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasks must be used within TasksProvider");
  }
  return ctx;
}

import type { Task, TaskUpsertPayload } from "@/types/task";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string };
    return data.detail || `${fallback}: ${response.status}`;
  } catch {
    return `${fallback}: ${response.status}`;
  }
}

export async function fetchAllTasks(token: string, signal?: AbortSignal): Promise<Task[]> {
  const pageSize = 100;
  let offset = 0;
  let allTasks: Task[] = [];

  while (true) {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      sort_by: "created_at",
      order: "desc",
    });

    const response = await fetch(`${API_BASE}/api/v1/tasks?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(await parseError(response, "Failed to fetch tasks"));
    }

    const page = (await response.json()) as Task[];
    allTasks = allTasks.concat(page);
    if (!Array.isArray(page) || page.length < pageSize) break;
    offset += pageSize;
  }

  return allTasks;
}

export async function createTaskRequest(token: string, payload: TaskUpsertPayload): Promise<Task> {
  const response = await fetch(`${API_BASE}/api/v1/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to create task"));
  }

  return (await response.json()) as Task;
}

export type TaskUpdatePayload = Partial<TaskUpsertPayload> & {
  completed?: boolean;
};

export async function updateTaskRequest(
  token: string,
  taskId: number,
  payload: TaskUpdatePayload
): Promise<Task> {
  const response = await fetch(`${API_BASE}/api/v1/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update task"));
  }

  return (await response.json()) as Task;
}

export async function toggleTaskCompletionRequest(token: string, taskId: number): Promise<Task> {
  const response = await fetch(`${API_BASE}/api/v1/tasks/${taskId}/toggle-completion`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update task"));
  }

  return (await response.json()) as Task;
}

export async function deleteTaskRequest(token: string, taskId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to delete task"));
  }
}

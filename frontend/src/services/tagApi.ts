import type { Tag } from "@/types/tag";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string };
    return data.detail || `${fallback}: ${response.status}`;
  } catch {
    return `${fallback}: ${response.status}`;
  }
}

export async function createTagRequest(
  token: string,
  payload: { name: string; color?: string | null }
): Promise<Tag> {
  const response = await fetch(`${API_BASE}/api/v1/tags`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to create tag"));
  }

  return (await response.json()) as Tag;
}

export async function updateTagRequest(
  token: string,
  tagId: number,
  payload: { name?: string; color?: string | null }
): Promise<Tag> {
  const response = await fetch(`${API_BASE}/api/v1/tags/${tagId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to update tag"));
  }

  return (await response.json()) as Tag;
}

export async function deleteTagRequest(token: string, tagId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/tags/${tagId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to delete tag"));
  }
}

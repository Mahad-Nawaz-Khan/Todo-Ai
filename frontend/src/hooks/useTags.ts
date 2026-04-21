import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import type { TagsChangedDetail } from "@/types/events";
import type { Tag } from "@/types/tag";

let cachedTags: Tag[] | null = null;
let inflightTagsRequest: Promise<Tag[]> | null = null;

function mergeTag(tags: Tag[], nextTag: Tag): Tag[] {
  const existingIndex = tags.findIndex((tag) => tag.id === nextTag.id);
  if (existingIndex === -1) {
    return [...tags, nextTag];
  }

  return tags.map((tag) => (tag.id === nextTag.id ? { ...tag, ...nextTag } : tag));
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>(cachedTags ?? []);
  const [isLoading, setIsLoading] = useState(!cachedTags);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchTags = useCallback(async (force = false): Promise<Tag[]> => {
    if (!force && cachedTags) {
      setTags(cachedTags);
      setIsLoading(false);
      setError(null);
      return cachedTags;
    }

    if (!force && inflightTagsRequest) {
      setIsLoading(true);
      try {
        const tagsData = await inflightTagsRequest;
        setTags(tagsData);
        setError(null);
        return tagsData;
      } catch {
        setTags([]);
        setError("Failed to load tags");
        return [];
      } finally {
        setIsLoading(false);
      }
    }

    const request = (async () => {
      const token = await getToken();
      const params = new URLSearchParams({ limit: "100", offset: "0" });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }

      return ((await response.json()) as Tag[]) || [];
    })();

    inflightTagsRequest = request;
    setIsLoading(true);

    try {
      const tagsData = await request;
      cachedTags = tagsData;
      setTags(tagsData);
      setError(null);
      return tagsData;
    } catch {
      cachedTags = null;
      setTags([]);
      setError("Failed to load tags");
      return [];
    } finally {
      inflightTagsRequest = null;
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    const handleTagsChanged = (event: Event) => {
      const detail = (event as CustomEvent<TagsChangedDetail>).detail;
      if (!detail) return;

      setTags((prev) => {
        if (detail.type === "created") {
          const next = mergeTag(prev, detail.tag);
          cachedTags = next;
          return next;
        }

        if (detail.type === "updated") {
          const next = prev.map((tag) => (tag.id === detail.tag.id ? { ...tag, ...detail.tag } : tag));
          cachedTags = next;
          return next;
        }

        if (detail.type === "deleted") {
          const next = prev.filter((tag) => tag.id !== detail.tagId);
          cachedTags = next;
          return next;
        }

        return prev;
      });
    };

    window.addEventListener("tags:changed", handleTagsChanged);
    return () => window.removeEventListener("tags:changed", handleTagsChanged);
  }, []);

  return {
    tags,
    isLoading,
    error,
    refreshTags: () => fetchTags(true),
  };
}

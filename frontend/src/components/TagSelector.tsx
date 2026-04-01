"use client";

import { Check, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import type { TagsChangedDetail } from "@/types/events";
import type { Tag } from "@/types/tag";

type TagSelectorProps = {
  selectedTags?: number[];
  onTagsChange: (tagIds: number[]) => void;
};

const TagSelector = ({ selectedTags = [], onTagsChange }: TagSelectorProps) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
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

      const tagsData = (await response.json()) as Tag[];
      setAllTags(tagsData || []);
    } catch {
      setAllTags([]);
    } finally {
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

      if (detail.type === "created") {
        const createdTag = detail.tag;
        setAllTags((prev) => (prev.some((tag) => tag.id === createdTag.id) ? prev : [...prev, createdTag]));
      }

      if (detail.type === "updated") {
        const updatedTag = detail.tag;
        setAllTags((prev) => prev.map((tag) => (tag.id === updatedTag.id ? { ...tag, ...updatedTag } : tag)));
      }

      if (detail.type === "deleted") {
        const deletedTagId = detail.tagId;
        setAllTags((prev) => prev.filter((tag) => tag.id !== deletedTagId));
        if (selectedTags.includes(deletedTagId)) {
          onTagsChange(selectedTags.filter((id) => id !== deletedTagId));
        }
      }
    };

    window.addEventListener("tags:changed", handleTagsChanged);
    return () => window.removeEventListener("tags:changed", handleTagsChanged);
  }, [onTagsChange, selectedTags]);

  const visibleTags = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allTags;
    return allTags.filter((tag) => tag.name.toLowerCase().includes(normalized));
  }, [allTags, query]);

  const createTag = async () => {
    if (!newTag.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTag.trim(),
          color: "#94A3B8",
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { detail?: string };
        throw new Error(errorData.detail || `Failed to create tag: ${response.status}`);
      }

      const createdTag = (await response.json()) as Tag;
      setAllTags((prev) => [...prev, createdTag]);
      setNewTag("");

      if (!selectedTags.includes(createdTag.id)) {
        onTagsChange([...selectedTags, createdTag.id]);
      }

      window.dispatchEvent(
        new CustomEvent<TagsChangedDetail>("tags:changed", {
          detail: { type: "created", tag: createdTag },
        })
      );
      toast.success("Tag created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create tag";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
      return;
    }
    onTagsChange([...selectedTags, tagId]);
  };

  const selectedTagObjects = allTags.filter((tag) => selectedTags.includes(tag.id));

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
      {error ? (
        <div className="mb-3 rounded-2xl border border-[rgba(255,135,124,0.24)] bg-[rgba(255,135,124,0.08)] px-4 py-3 text-sm text-[#ffd4cf]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {selectedTagObjects.length ? (
          selectedTagObjects.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/12"
            >
              <span className="size-2 rounded-full bg-[var(--accent-ice)]" />
              {tag.name}
            </button>
          ))
        ) : (
          <span className="text-sm text-[var(--text-dim)]">No tags selected yet.</span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter existing tags"
          className="input-shell rounded-2xl px-4 py-3 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void createTag();
              }
            }}
            placeholder="New tag"
            className="input-shell min-w-0 rounded-2xl px-4 py-3 text-sm"
          />
          <button type="button" onClick={() => void createTag()} disabled={isLoading} className="action-button-secondary rounded-2xl px-4 py-3">
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
        {visibleTags.map((tag) => {
          const selected = selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
                selected
                  ? "border-[rgba(144,229,255,0.24)] bg-[rgba(144,229,255,0.12)] text-white"
                  : "border-white/8 bg-white/5 text-[var(--text-dim)] hover:border-white/12 hover:bg-white/8 hover:text-white"
              }`}
            >
              {selected ? <Check className="size-3.5" /> : <span className="size-2 rounded-full bg-white/25" />}
              {tag.name}
            </button>
          );
        })}
        {!visibleTags.length && !isLoading ? <span className="text-sm text-[var(--text-dim)]">No tags matched that search.</span> : null}
      </div>
    </div>
  );
};

export default TagSelector;

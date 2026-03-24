"use client";

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import type { TagsChangedDetail } from '@/types/events';
import type { Tag } from '@/types/tag';

interface TagSelectorProps {
  selectedTags?: number[];
  onTagsChange: (tagIds: number[]) => void;
}

const TagSelector = ({ selectedTags = [], onTagsChange }: TagSelectorProps) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      const params = new URLSearchParams();
      params.append('limit', '100');
      params.append('offset', '0');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
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
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    const handleTagsChanged = (event: Event) => {
      const detail = (event as CustomEvent<TagsChangedDetail>).detail;
      if (!detail) {
        return;
      }

      if (detail.type === 'created') {
        const createdTag = detail.tag;
        setAllTags((prev) => {
          if (prev.some((tag) => tag.id === createdTag.id)) {
            return prev;
          }
          return [...prev, createdTag];
        });
      }

      if (detail.type === 'updated') {
        const updatedTag = detail.tag;
        setAllTags((prev) =>
          prev.map((tag) => {
            if (tag.id !== updatedTag.id) {
              return tag;
            }
            return {
              ...tag,
              ...updatedTag,
            };
          })
        );
      }

      if (detail.type === 'deleted') {
        const deletedTagId = detail.tagId;
        setAllTags((prev) => prev.filter((tag) => tag.id !== deletedTagId));

        if (selectedTags.includes(deletedTagId)) {
          onTagsChange(selectedTags.filter((id) => id !== deletedTagId));
        }
      }
    };

    window.addEventListener('tags:changed', handleTagsChanged);
    return () => window.removeEventListener('tags:changed', handleTagsChanged);
  }, [onTagsChange, selectedTags]);

  const createTag = async () => {
    if (!newTag.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTag.trim(),
          color: '#94A3B8',
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { detail?: string };
        throw new Error(errorData.detail || `Failed to create tag: ${response.status}`);
      }

      const createdTag = (await response.json()) as Tag;
      setAllTags((prev) => [...prev, createdTag]);
      setNewTag('');

      if (!selectedTags.includes(createdTag.id)) {
        onTagsChange([...selectedTags, createdTag.id]);
      }

      window.dispatchEvent(
        new CustomEvent<TagsChangedDetail>('tags:changed', {
          detail: {
            type: 'created',
            tag: createdTag,
          },
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const getTagName = (tagId: number) => {
    const tag = allTags.find((item) => item.id === tagId);
    return tag ? tag.name : '';
  };

  if (isLoading && allTags.length === 0) {
    return <div className="text-sm text-white/70">Loading tags...</div>;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Error: {error}
        </div>
      )}

      <div className="mb-2">
        <label className="block text-sm font-medium text-white/80">Selected tags</label>
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tagId) => (
            <span
              key={tagId}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/80"
            >
              {getTagName(tagId)}
              <button
                type="button"
                onClick={() => toggleTag(tagId)}
                className="ml-1 text-white/40 hover:text-red-200"
              >
                ×
              </button>
            </span>
          ))}
          {selectedTags.length === 0 && <span className="text-sm text-white/60">No tags selected</span>}
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-white/80">Available tags</label>
        <div className="max-h-32 flex flex-wrap gap-2 overflow-y-auto">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedTags.includes(tag.id)
                  ? 'bg-blue-600 text-white'
                  : 'border border-white/10 bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              {tag.name}
            </button>
          ))}
          {allTags.length === 0 && !isLoading && (
            <span className="text-sm text-white/60">No tags created yet. Create one above.</span>
          )}
        </div>
      </div>

      <div className="mt-2">
        <label className="block text-sm font-medium text-white/80">Create new tag</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void createTag();
              }
            }}
            placeholder="Tag name"
            className="mt-1 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          />
          <button
            type="button"
            onClick={() => {
              void createTag();
            }}
            disabled={isLoading}
            className="mt-1 rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagSelector;

"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

const TagList = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const handleTagsChanged = (event) => {
      const detail = event?.detail;
      if (!detail) {
        return;
      }

      if (detail.type === 'created' && detail.tag) {
        const createdTag = detail.tag;
        setTags((prev) => {
          if (prev.some((tag) => tag.id === createdTag.id)) {
            return prev;
          }
          return [...prev, createdTag];
        });
      }

      if (detail.type === 'updated' && detail.tag) {
        const updatedTag = detail.tag;
        setTags((prev) => prev.map((tag) => {
          if (tag.id !== updatedTag.id) {
            return tag;
          }
          return {
            ...tag,
            ...updatedTag,
          };
        }));
      }

      if (detail.type === 'deleted' && detail.tagId) {
        const deletedTagId = detail.tagId;
        setTags((prev) => prev.filter((tag) => tag.id !== deletedTagId));

        if (editingTagId === deletedTagId) {
          setEditingTagId(null);
          setEditingTagName('');
        }
      }
    };

    window.addEventListener('tags:changed', handleTagsChanged);
    return () => window.removeEventListener('tags:changed', handleTagsChanged);
  }, [editingTagId]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const params = new URLSearchParams();
      params.append('limit', '100');
      params.append('offset', '0');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }

      const tagsData = await response.json();
      setTags(tagsData || []);
    } catch (err) {
      // On error, just show empty state - don't throw error
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: '#94A3B8',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to create tag: ${response.status}`);
      }

      const createdTag = await response.json();
      setTags((prev) => [...prev, createdTag]);
      setNewTagName('');

      window.dispatchEvent(new CustomEvent('tags:changed', {
        detail: {
          type: 'created',
          tag: createdTag,
        },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTag = async (tagId) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags/${tagId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingTagName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update tag: ${response.status}`);
      }

      const updatedTag = await response.json();
      setTags((prev) => prev.map((tag) => tag.id === tagId ? updatedTag : tag));
      setEditingTagId(null);
      setEditingTagName('');

      window.dispatchEvent(new CustomEvent('tags:changed', {
        detail: {
          type: 'updated',
          tag: updatedTag,
        },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete tag: ${response.status}`);
      }

      setTags((prev) => prev.filter((tag) => tag.id !== tagId));

      window.dispatchEvent(new CustomEvent('tags:changed', {
        detail: {
          type: 'deleted',
          tagId,
        },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <h3 className="text-lg font-semibold text-white">Manage Tags</h3>
          <p className="mt-1 text-sm text-white/70">Create tags once and reuse them across tasks.</p>
        </div>
        <div className="mt-1">
          <span className="inline-flex rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 hover:bg-white/15">
            {isOpen ? 'Hide' : 'Open'}
          </span>
        </div>
      </button>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Error: {error}
        </div>
      )}

      {loading && tags.length === 0 && (
        <div className="mt-4 text-sm text-white/70">Loading tags...</div>
      )}

      {!isOpen ? null : (
        <>
          <form onSubmit={createTag} className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
            <h4 className="font-medium text-white">Create new tag</h4>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>

          <div className="mt-6">
            <h4 className="font-medium text-white">Your tags</h4>
            {tags.length === 0 ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                No tags created yet.
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {tags.map(tag => (
                  <li key={tag.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    {editingTagId === tag.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => updateTag(tag.id)}
                          disabled={loading}
                          className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTagId(null)}
                          className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/15"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-white/20"
                          style={{ backgroundColor: tag.color || '#94A3B8' }}
                        />
                        <span className="font-medium text-white">{tag.name}</span>
                        <span className="text-xs text-white/50">ID: {tag.id}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {editingTagId !== tag.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTagId(tag.id);
                            setEditingTagName(tag.name);
                          }}
                          disabled={loading}
                          className="text-sm font-medium text-blue-300 hover:text-blue-200"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteTag(tag.id)}
                        disabled={loading}
                        className="text-sm font-medium text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TagList;
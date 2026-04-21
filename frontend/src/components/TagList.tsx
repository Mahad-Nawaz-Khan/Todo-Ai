"use client";

import { Pencil, Tags, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { useTags } from "@/hooks/useTags";
import type { TagsChangedDetail } from "@/types/events";
import type { Tag } from "@/types/tag";

const TagList = () => {
  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();
  const { tags, isLoading: loading } = useTags();

  useEffect(() => {
    const handleTagsChanged = (event: Event) => {
      const detail = (event as CustomEvent<TagsChangedDetail>).detail;
      if (!detail) return;

      if (detail.type === "deleted") {
        const deletedTagId = detail.tagId;
        if (editingTagId === deletedTagId) {
          setEditingTagId(null);
          setEditingTagName("");
        }
      }
    };

    window.addEventListener("tags:changed", handleTagsChanged);
    return () => window.removeEventListener("tags:changed", handleTagsChanged);
  }, [editingTagId]);

  const createTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newTagName.trim(), color: "#94A3B8" }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { detail?: string };
        throw new Error(errorData.detail || `Failed to create tag: ${response.status}`);
      }

      const createdTag = (await response.json()) as Tag;
      setNewTagName("");
      window.dispatchEvent(new CustomEvent<TagsChangedDetail>("tags:changed", { detail: { type: "created", tag: createdTag } }));
      toast.success("Tag created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create tag";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTag = async (tagId: number) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags/${tagId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editingTagName.trim() }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { detail?: string };
        throw new Error(errorData.detail || `Failed to update tag: ${response.status}`);
      }

      const updatedTag = (await response.json()) as Tag;
      setEditingTagId(null);
      setEditingTagName("");
      window.dispatchEvent(new CustomEvent<TagsChangedDetail>("tags:changed", { detail: { type: "updated", tag: updatedTag } }));
      toast.success("Tag updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update tag";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTag = async (tagId: number) => {
    if (!window.confirm("Are you sure you want to delete this tag?")) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tags/${tagId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { detail?: string };
        throw new Error(errorData.detail || `Failed to delete tag: ${response.status}`);
      }

      window.dispatchEvent(new CustomEvent<TagsChangedDetail>("tags:changed", { detail: { type: "deleted", tagId } }));
      toast.success("Tag deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete tag";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section-card rounded-[28px] p-4 md:p-6">
      <button type="button" onClick={() => setIsOpen((value) => !value)} className="flex w-full items-start justify-between gap-4 text-left">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-(--text-faint)">Taxonomy</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">Manage tags</h3>
          <p className="mt-2 text-sm text-(--text-dim)">Keep reusable labels tidy across the whole workspace.</p>
        </div>
        <span className="flex size-12 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-(--accent-blue)">
          <Tags className="size-5" />
        </span>
      </button>

      {isOpen ? (
        <div className="animate-expand overflow-hidden">
          {error ? (
            <div className="error-banner mt-5 rounded-2xl border border-[rgba(255,135,124,0.24)] bg-[rgba(255,135,124,0.08)] px-4 py-3 text-sm text-[#ffd4cf]">
              {error}
            </div>
          ) : null}

          <form onSubmit={createTag} className="mt-5 flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Add a reusable label"
              className="input-shell flex-1 rounded-2xl px-4 py-3 text-sm"
            />
            <button type="submit" disabled={loading || isSubmitting} className="btn-press action-button-primary rounded-2xl px-4 py-3 text-sm">
              Add
            </button>
          </form>

          <div className="mt-5 space-y-3 stagger-children">
            {loading && tags.length === 0 ? (
              <div className="text-sm text-(--text-dim)">Loading tags...</div>
            ) : tags.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-(--text-dim)">No tags yet.</div>
            ) : (
              tags.map((tag) => {
                const isEditing = editingTagId === tag.id;

                return (
                  <div key={tag.id} className="animate-fade-in-up-sm flex flex-col gap-3 rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 md:flex-row md:items-center md:justify-between">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        className="input-shell w-full rounded-2xl px-4 py-3 text-sm md:max-w-xs"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="tag-pill size-2.5 rounded-full bg-(--accent-ice)" />
                        <div className="text-sm font-medium text-white">{tag.name}</div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button type="button" onClick={() => void updateTag(tag.id)} className="btn-press action-button-primary rounded-2xl px-4 py-2 text-sm">
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTagId(null);
                              setEditingTagName("");
                            }}
                            className="btn-press action-button-secondary rounded-2xl px-4 py-2 text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTagId(tag.id);
                              setEditingTagName(tag.name);
                            }}
                            className="btn-press action-button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm"
                          >
                            <Pencil className="size-4" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteTag(tag.id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(255,135,124,0.2)] bg-[rgba(255,135,124,0.08)] px-4 py-2 text-sm text-[#ffd4cf] transition hover:bg-[rgba(255,135,124,0.12)]"
                          >
                            <Trash2 className="size-4" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default TagList;

"use client";

import { MoreHorizontal, Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/context/TasksContext";
import { useUI } from "@/context/UIContext";
import { useTags } from "@/hooks/useTags";
import { nextTagColor } from "@/lib/tagColors";
import { createTagRequest, deleteTagRequest, updateTagRequest } from "@/services/tagApi";
import type { TagsChangedDetail } from "@/types/events";
import type { Tag } from "@/types/tag";

import { TagColorPicker } from "./TagColorPicker";

export function TagsSection() {
  const { tags, isLoading } = useTags();
  const { counts } = useTasks();
  const { getToken } = useAuth();
  const { confirm } = useUI();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || busy) return;

    try {
      setBusy(true);
      const token = await getToken();
      if (!token) throw new Error("Sign in to create tags");
      const color = nextTagColor(tags.map((t) => t.color));
      const created = await createTagRequest(token, { name: trimmed, color });
      window.dispatchEvent(
        new CustomEvent<TagsChangedDetail>("tags:changed", {
          detail: { type: "created", tag: created },
        })
      );
      setNewName("");
      setCreating(false);
      toast.success("Tag created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (tag: Tag, patch: { name?: string; color?: string }) => {
    try {
      setBusy(true);
      const token = await getToken();
      if (!token) throw new Error("Sign in to update tags");
      const updated = await updateTagRequest(token, tag.id, patch);
      window.dispatchEvent(
        new CustomEvent<TagsChangedDetail>("tags:changed", {
          detail: { type: "updated", tag: updated },
        })
      );
      setEditingId(null);
      setEditingName("");
      toast.success("Tag updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update tag");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    const ok = await confirm({
      title: `Delete #${tag.name}?`,
      description: "Tasks won't be deleted, only the label will be removed from them.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;

    try {
      setBusy(true);
      const token = await getToken();
      if (!token) throw new Error("Sign in to delete tags");
      await deleteTagRequest(token, tag.id);
      window.dispatchEvent(
        new CustomEvent<TagsChangedDetail>("tags:changed", {
          detail: { type: "deleted", tagId: tag.id },
        })
      );
      toast.success("Tag deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete tag");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="tags" className="rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line-subtle px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-fg">Tags</h2>
          <p className="mt-0.5 text-[13px] text-fg-muted">
            Organize tasks with colored labels.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Plus className="size-3.5" />}
          onClick={() => setCreating((prev) => !prev)}
        >
          New tag
        </Button>
      </div>

      {creating ? (
        <form
          onSubmit={handleCreate}
          className="flex items-center gap-2 border-b border-line-subtle px-5 py-3"
        >
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }}
            placeholder="Tag name…"
            className="flex-1"
          />
          <Button type="submit" variant="primary" size="sm" loading={busy} disabled={!newName.trim()}>
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
          >
            Cancel
          </Button>
        </form>
      ) : null}

      {!isLoading && tags.length === 0 ? (
        <EmptyState
          icon={<TagIcon className="size-5" />}
          title="No tags yet"
          description="Create reusable labels to group and filter tasks across views."
          className="py-10"
        />
      ) : (
        <ul className="divide-y divide-line-subtle">
          {tags.map((tag) => {
            const isEditing = editingId === tag.id;
            const taskCount = counts.byTag[tag.id] ?? 0;

            return (
              <li key={tag.id} className="flex h-12 items-center gap-2.5 px-4">
                <TagColorPicker
                  color={tag.color}
                  tagName={tag.name}
                  onSelect={(hex) => void handleUpdate(tag, { color: hex })}
                />

                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const trimmed = editingName.trim();
                      if (trimmed && trimmed !== tag.name) {
                        void handleUpdate(tag, { name: trimmed });
                      } else {
                        setEditingId(null);
                      }
                    }}
                    className="flex flex-1 items-center gap-2"
                  >
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setEditingName("");
                        }
                      }}
                      className="max-w-xs"
                    />
                    <Button type="submit" variant="primary" size="sm" loading={busy}>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(null);
                        setEditingName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(tag.id);
                        setEditingName(tag.name);
                      }}
                      className="min-w-0 flex-1 truncate text-left text-sm font-medium text-fg hover:text-accent-text"
                    >
                      {tag.name}
                    </button>
                    <span className="text-xs text-fg-subtle tabular-nums">
                      {taskCount} {taskCount === 1 ? "task" : "tasks"}
                    </span>
                    <Menu
                      align="end"
                      minWidth={150}
                      trigger={({ ref, isOpen, toggle }) => (
                        <Button
                          ref={ref}
                          variant="ghost"
                          size="icon-sm"
                          onClick={toggle}
                          aria-expanded={isOpen}
                          aria-label={`Actions for tag ${tag.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      )}
                    >
                      {({ close }) => (
                        <>
                          <MenuItem
                            icon={<Pencil className="size-4" />}
                            label="Rename"
                            onSelect={() => {
                              close();
                              setEditingId(tag.id);
                              setEditingName(tag.name);
                            }}
                          />
                          <MenuSeparator />
                          <MenuItem
                            icon={<Trash2 className="size-4" />}
                            label="Delete"
                            danger
                            onSelect={() => {
                              close();
                              void handleDelete(tag);
                            }}
                          />
                        </>
                      )}
                    </Menu>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

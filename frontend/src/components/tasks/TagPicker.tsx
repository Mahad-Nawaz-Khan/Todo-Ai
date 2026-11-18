"use client";

import { Hash, Plus } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Popover } from "@/components/ui/Popover";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/context/TasksContext";
import { useTags } from "@/hooks/useTags";
import { nextTagColor, resolveTagColor } from "@/lib/tagColors";
import { cn } from "@/lib/utils";
import { createTagRequest } from "@/services/tagApi";
import type { TagsChangedDetail } from "@/types/events";

export interface TagPickerProps {
  selectedTagIds: number[];
  onChange: (nextIds: number[]) => void;
  triggerLabel?: string;
  renderTrigger?: (props: { isOpen: boolean; toggle: () => void }) => ReactNode;
}

export function TagPicker({
  selectedTagIds,
  onChange,
  triggerLabel,
  renderTrigger,
}: Readonly<TagPickerProps>) {
  const { tags } = useTags();
  const { counts } = useTasks();
  const { getToken } = useAuth();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(normalized));
  }, [normalized, tags]);

  const hasExactMatch = useMemo(
    () => Boolean(normalized) && tags.some((t) => t.name.toLowerCase() === normalized),
    [normalized, tags]
  );

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
      return;
    }
    onChange([...selectedTagIds, tagId]);
  };

  const handleCreate = async () => {
    const trimmed = query.trim();
    if (!trimmed || creating) return;

    try {
      setCreating(true);
      const token = await getToken();
      if (!token) throw new Error("Sign in to create tags");
      const color = nextTagColor(tags.map((t) => t.color));
      const created = await createTagRequest(token, { name: trimmed, color });
      window.dispatchEvent(
        new CustomEvent<TagsChangedDetail>("tags:changed", {
          detail: { type: "created", tag: created },
        })
      );
      if (!selectedTagIds.includes(created.id)) {
        onChange([...selectedTagIds, created.id]);
      }
      setQuery("");
      toast.success(`Tag #${created.name} created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const selectedCount = selectedTagIds.length;
  const buttonText =
    triggerLabel ?? (selectedCount > 0 ? `Tags (${selectedCount})` : "Tags");

  return (
    <Popover
      align="start"
      maxWidth={260}
      trigger={({ ref, isOpen, toggle }) =>
        renderTrigger ? (
          <span ref={ref as React.RefObject<HTMLSpanElement | null>} className="inline-flex">
            {renderTrigger({ isOpen, toggle })}
          </span>
        ) : (
          <button
            ref={ref}
            type="button"
            onClick={toggle}
            aria-expanded={isOpen}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors duration-[var(--dur-fast)]",
              selectedCount > 0
                ? "border-accent-border bg-accent-subtle text-accent-text"
                : "border-line bg-surface dark:bg-surface-2 text-fg-muted hover:border-line-strong hover:text-fg"
            )}
          >
            <Hash className="size-3.5" aria-hidden="true" />
            <span>{buttonText}</span>
          </button>
        )
      }
    >
      {() => (
        <div className="flex w-[244px] flex-col gap-1.5 p-1">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && normalized && !hasExactMatch) {
                e.preventDefault();
                void handleCreate();
              }
            }}
            placeholder="Search or create tag…"
            className="h-7 text-xs"
          />

          <div className="max-h-[240px] space-y-0.5 overflow-y-auto py-0.5">
            {filtered.map((tag) => {
              const checked = selectedTagIds.includes(tag.id);
              const count = counts.byTag[tag.id] ?? 0;

              return (
                <div
                  key={tag.id}
                  className="flex h-8 items-center gap-2 rounded-sm px-1.5 hover:bg-hover"
                >
                  <Checkbox
                    checked={checked}
                    onChange={() => toggleTag(tag.id)}
                    aria-label={tag.name}
                  />
                  <button
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] text-fg"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: resolveTagColor(tag.color) }}
                    />
                    <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                    {count > 0 ? (
                      <span className="text-xs text-fg-subtle tabular-nums">{count}</span>
                    ) : null}
                  </button>
                </div>
              );
            })}

            {!filtered.length && !normalized ? (
              <p className="px-2 py-3 text-center text-xs text-fg-subtle">No tags yet</p>
            ) : null}

            {normalized && !hasExactMatch ? (
              <button
                type="button"
                disabled={creating}
                onClick={() => void handleCreate()}
                className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-[13px] font-medium text-accent-text hover:bg-accent-subtle"
              >
                <Plus className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">Create “{query.trim()}”</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </Popover>
  );
}

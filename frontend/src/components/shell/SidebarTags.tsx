"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/context/TasksContext";
import { useTags } from "@/hooks/useTags";
import { nextTagColor, resolveTagColor } from "@/lib/tagColors";
import { cn } from "@/lib/utils";
import { createTagRequest } from "@/services/tagApi";
import type { TagsChangedDetail } from "@/types/events";

interface SidebarTagsProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarTags({ collapsed = false, onNavigate }: Readonly<SidebarTagsProps>) {
  const pathname = usePathname();
  const { tags } = useTags();
  const { counts } = useTasks();
  const { getToken } = useAuth();
  const [creating, setCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (collapsed) {
    return (
      <div className="space-y-0.5 pt-2">
        {tags.slice(0, 6).map((tag) => {
          const href = `/tags/${tag.id}`;
          const active = pathname === href;
          return (
            <Link
              key={tag.id}
              href={href}
              onClick={onNavigate}
              title={`#${tag.name}`}
              aria-label={`Tag ${tag.name}`}
              className={cn(
                "flex h-8 items-center justify-center rounded-md transition-colors",
                active ? "bg-selected" : "hover:bg-hover"
              )}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: resolveTagColor(tag.color) }}
              />
            </Link>
          );
        })}
      </div>
    );
  }

  const handleCreateTag = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed || submitting) return;

    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) throw new Error("Sign in to create tags");
      const color = nextTagColor(tags.map((t) => t.color));
      const created = await createTagRequest(token, { name: trimmed, color });
      window.dispatchEvent(
        new CustomEvent<TagsChangedDetail>("tags:changed", {
          detail: { type: "created", tag: created },
        })
      );
      setNewTagName("");
      setCreating(false);
      toast.success(`Tag #${created.name} created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setSubmitting(false);
    }
  };

  const visibleTags = showAll ? tags : tags.slice(0, 8);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-fg-subtle">
          Tags
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCreating((prev) => !prev)}
          aria-label="Create tag"
          title="New tag"
          className="size-6 text-fg-subtle"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      {creating ? (
        <form onSubmit={handleCreateTag} className="flex items-center gap-1 px-1 py-1">
          <Input
            autoFocus
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setCreating(false);
                setNewTagName("");
              }
            }}
            placeholder="Tag name…"
            disabled={submitting}
            className="h-7 text-xs"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setCreating(false);
              setNewTagName("");
            }}
            aria-label="Cancel new tag"
            className="size-7 shrink-0"
          >
            <X className="size-3.5" />
          </Button>
        </form>
      ) : null}

      {tags.length === 0 && !creating ? (
        <p className="px-2 py-1 text-xs text-fg-subtle">No tags yet</p>
      ) : null}

      <div className="space-y-0.5">
        {visibleTags.map((tag) => {
          const href = `/tags/${tag.id}`;
          const active = pathname === href;
          const count = counts.byTag[tag.id] ?? 0;

          return (
            <Link
              key={tag.id}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors duration-[var(--dur-fast)]",
                active
                  ? "bg-selected font-medium text-fg"
                  : "text-fg-muted hover:bg-hover hover:text-fg"
              )}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: resolveTagColor(tag.color) }}
              />
              <span className="min-w-0 flex-1 truncate">{tag.name}</span>
              {count > 0 ? (
                <span className="text-xs text-fg-subtle tabular-nums">{count}</span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {tags.length > 8 ? (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="w-full rounded-md px-2 py-1 text-left text-xs font-medium text-fg-subtle transition-colors hover:bg-hover hover:text-fg"
        >
          {showAll ? "Show less" : `Show all (${tags.length})`}
        </button>
      ) : null}
    </div>
  );
}

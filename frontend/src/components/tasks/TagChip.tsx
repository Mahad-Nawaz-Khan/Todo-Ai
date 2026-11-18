import { X } from "lucide-react";

import { resolveTagColor } from "@/lib/tagColors";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/tag";

export interface TagChipProps {
  tag: Tag;
  onRemove?: () => void;
  dimmed?: boolean;
  className?: string;
}

export function TagChip({ tag, onRemove, dimmed = false, className }: Readonly<TagChipProps>) {
  const dotColor = resolveTagColor(tag.color);

  return (
    <span
      className={cn(
        "group/tag inline-flex h-5 items-center gap-1.5 rounded-full bg-hover px-2 text-xs font-medium text-fg-muted whitespace-nowrap",
        dimmed && "opacity-60",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      <span className="max-w-[120px] truncate">{tag.name}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove tag ${tag.name}`}
          className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-selected hover:text-fg"
        >
          <X className="size-2.5" aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}

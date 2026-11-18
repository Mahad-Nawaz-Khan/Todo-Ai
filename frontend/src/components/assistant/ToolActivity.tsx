"use client";

import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import type { ChatProgressEvent } from "@/services/chatService";

export interface ToolActivityProps {
  events: ChatProgressEvent[];
  isLoading: boolean;
}

export function ToolActivity({ events, isLoading }: Readonly<ToolActivityProps>) {
  const [expanded, setExpanded] = useState(false);

  if (!events.length) return null;

  const toolCalls = events.filter((e) => e.kind === "tool_call");
  const lastTool = toolCalls[toolCalls.length - 1]?.tool;

  let summary = `Used ${toolCalls.length} tool${toolCalls.length === 1 ? "" : "s"}`;
  if (isLoading) {
    summary = lastTool ? `Running ${lastTool}…` : "Working on your tasks…";
  }

  return (
    <div className="rounded-md border border-line-subtle bg-surface-2 px-2.5 py-1.5 text-[13px]">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 text-left text-fg-muted hover:text-fg"
      >
        {isLoading ? (
          <Spinner className="size-3.5" />
        ) : (
          <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
        )}
      </button>

      {expanded ? (
        <ul className="mt-2 space-y-1 border-t border-line-subtle pt-1.5 font-mono text-xs text-fg-subtle">
          {toolCalls.map((ev, idx) => (
            <li key={`${ev.tool ?? "tool"}-${idx}`} className="truncate">
              → {ev.tool || "tool"}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

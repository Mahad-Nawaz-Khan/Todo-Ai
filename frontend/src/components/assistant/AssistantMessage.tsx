"use client";

import { Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import remarkGfm from "remark-gfm";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export function AssistantMessage({
  text,
  timestamp,
  isStreaming = false,
}: Readonly<{
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}>) {
  const timeLabel = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-sm bg-accent-subtle text-accent-text">
          <Sparkles className="size-3" aria-hidden="true" />
        </span>
        <span className="text-xs font-semibold text-fg-muted">Assistant</span>
        <span className="text-xs text-fg-subtle tabular-nums">{timeLabel}</span>
      </div>

      <div className="markdown-content pl-7">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        {isStreaming ? (
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-accent-text align-middle"
          />
        ) : null}
      </div>
    </div>
  );
}

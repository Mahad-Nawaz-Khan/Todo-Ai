"use client";

import { ArrowUp } from "lucide-react";
import { type RefObject } from "react";

import { Button } from "@/components/ui/Button";
import { useAutoGrow } from "@/hooks/useAutoGrow";

export interface AssistantComposerProps {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export function AssistantComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  isLoading = false,
  inputRef,
}: Readonly<AssistantComposerProps>) {
  useAutoGrow(inputRef, value, 180);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="border-t border-line-subtle p-3"
    >
      <div className="field-shell rounded-lg border border-line bg-surface dark:bg-surface-2 p-2.5 transition-[border-color,box-shadow] duration-[var(--dur-fast)]">
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask anything about your tasks…"
          disabled={disabled || isLoading}
          maxLength={5000}
          aria-label="Message assistant"
          className="w-full resize-none bg-transparent text-sm leading-[22px] text-fg outline-none placeholder:text-fg-subtle disabled:opacity-50"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="hidden text-[11px] text-fg-subtle sm:inline">
            ↵ send · ⇧↵ new line
          </span>
          <Button
            type="submit"
            variant="primary"
            size="icon-sm"
            disabled={!value.trim() || disabled || isLoading}
            aria-label="Send message"
            className="ml-auto"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </form>
  );
}

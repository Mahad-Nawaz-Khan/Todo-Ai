"use client";

import { MoreHorizontal, Sparkles, SquarePen } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Menu, MenuItem } from "@/components/ui/Menu";
import type { PopoverTriggerProps } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";

import { AssistantConversation } from "./AssistantConversation";

function renderSessionOptionsTrigger({ ref, isOpen, toggle }: PopoverTriggerProps) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-expanded={isOpen}
      aria-label="Session options"
    >
      <MoreHorizontal className="size-4" />
    </Button>
  );
}

export function AssistantFullPage() {
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent("todo:start-new-chat"));
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-120px)] w-full max-w-[720px] flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface md:h-[calc(100dvh-108px)]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line-subtle px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-sm bg-accent-subtle text-accent-text">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </span>
          <h1 className="text-sm font-semibold text-fg">Assistant</h1>
          <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isThinking ? "animate-pulse bg-accent-text" : "bg-success"
              )}
              aria-hidden="true"
            />
            <span>{isThinking ? "Thinking…" : "Ready"}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<SquarePen className="size-3.5" />}
            onClick={handleNewChat}
          >
            New chat
          </Button>
          <Menu
            align="end"
            minWidth={210}
            trigger={renderSessionOptionsTrigger}
          >
            {({ close }) => (
              <>
                <div className="px-2 py-1.5 font-mono text-[11px] text-fg-subtle">
                  Session {sessionId ? sessionId.slice(-8) : "—"}
                </div>
                <MenuItem
                  icon={<SquarePen className="size-4" />}
                  label="Clear conversation"
                  onSelect={() => {
                    close();
                    handleNewChat();
                  }}
                />
              </>
            )}
          </Menu>
        </div>
      </div>

      <AssistantConversation
        onStatusChange={(loading, id) => {
          setIsThinking(loading);
          setSessionId(id);
        }}
      />
    </div>
  );
}

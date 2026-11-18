"use client";

import { Maximize2, Sparkles, SquarePen, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Tooltip } from "@/components/ui/Tooltip";
import { useUI } from "@/context/UIContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

import { AssistantConversation } from "./AssistantConversation";

interface AssistantChromeProps {
  isThinking: boolean;
  onNewChat: () => void;
  onExpand: () => void;
  onClose: () => void;
}

function AssistantHeader({
  isThinking,
  onNewChat,
  onExpand,
  onClose,
}: Readonly<AssistantChromeProps>) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-line-subtle px-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex size-6 items-center justify-center rounded-sm bg-accent-subtle text-accent-text">
          <Sparkles className="size-3.5" aria-hidden="true" />
        </span>
        <div>
          <div className="text-sm font-semibold leading-tight text-fg">Assistant</div>
          <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isThinking ? "animate-pulse bg-accent-text" : "bg-success"
              )}
              aria-hidden="true"
            />
            <span>{isThinking ? "Thinking…" : "Ready"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <Tooltip label="New chat" side="bottom">
          <Button variant="ghost" size="icon-sm" onClick={onNewChat} aria-label="New chat">
            <SquarePen className="size-4" />
          </Button>
        </Tooltip>
        <Tooltip label="Open full page" side="bottom">
          <Button variant="ghost" size="icon-sm" onClick={onExpand} aria-label="Open full assistant page">
            <Maximize2 className="size-4" />
          </Button>
        </Tooltip>
        <Tooltip label="Close assistant" side="bottom">
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close assistant">
            <X className="size-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

export function AssistantPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const { assistantOpen, setAssistantOpen } = useUI();
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isLg = useMediaQuery("(min-width: 1024px)");
  const [isThinking, setIsThinking] = useState(false);

  if (!assistantOpen || pathname === "/chat") {
    return null;
  }

  const handleExpand = () => {
    setAssistantOpen(false);
    router.push("/chat");
  };

  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent("todo:start-new-chat"));
  };

  const body = (
    <div className="flex h-full flex-col bg-surface">
      <AssistantHeader
        isThinking={isThinking}
        onNewChat={handleNewChat}
        onExpand={handleExpand}
        onClose={() => setAssistantOpen(false)}
      />
      <AssistantConversation onStatusChange={(loading) => setIsThinking(loading)} />
    </div>
  );

  if (isXl) {
    return (
      <aside
        aria-label="AI Assistant"
        className="sticky top-0 flex h-dvh w-[384px] shrink-0 flex-col border-l border-line-subtle bg-surface"
      >
        {body}
      </aside>
    );
  }

  if (isLg) {
    return (
      <aside
        aria-label="AI Assistant"
        className="fixed inset-y-2 right-2 z-40 flex w-[384px] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
      >
        {body}
      </aside>
    );
  }

  return (
    <Sheet
      open={assistantOpen}
      onClose={() => setAssistantOpen(false)}
      ariaLabel="AI Assistant"
      widthClass="md:w-[400px]"
    >
      {body}
    </Sheet>
  );
}

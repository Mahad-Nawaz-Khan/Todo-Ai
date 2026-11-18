"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useUser } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import type { TaskViewAction } from "@/services/chatService";
import type { ApplyTaskViewDetail } from "@/types/events";

import { ActionResultCard, type OperationShape } from "./ActionResultCard";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantEmpty } from "./AssistantEmpty";
import { AssistantMessage } from "./AssistantMessage";
import { ToolActivity } from "./ToolActivity";
import { TypingIndicator } from "./TypingIndicator";
import { UserMessage } from "./UserMessage";

export interface AssistantConversationProps {
  onStatusChange?: (isLoading: boolean, sessionId: string) => void;
}

function buildTasksUrlFromView(view: TaskViewAction): string {
  const params = new URLSearchParams();
  if (view.completed === true) params.set("status", "done");
  else if (view.completed === false) params.set("status", "open");
  if (view.priority) params.set("priority", view.priority);
  if (view.sortBy) params.set("sort", view.sortBy);
  if (view.order) params.set("order", view.order);
  const qs = params.toString();
  return qs ? `/tasks?${qs}` : "/tasks";
}

export function AssistantConversation({
  onStatusChange,
}: Readonly<AssistantConversationProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  const {
    messages,
    sendMessage,
    isLoading,
    startNewConversation,
    sessionId,
    operationPerformed,
    progressEvents,
  } = useChat([], { autoLoadHistory: true, enableStreaming: true });

  const [inputText, setInputText] = useState("");
  const [prevOpRef, setPrevOpRef] = useState<unknown>(null);
  const [retainedOp, setRetainedOp] = useState<OperationShape | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  if (operationPerformed && typeof operationPerformed === "object" && operationPerformed !== prevOpRef) {
    setPrevOpRef(operationPerformed);
    setRetainedOp(operationPerformed as OperationShape);
  }

  useEffect(() => {
    onStatusChange?.(isLoading, sessionId);
  }, [isLoading, onStatusChange, sessionId]);

  const handleNewChat = useCallback(() => {
    setRetainedOp(null);
    void startNewConversation();
    toast.success("Started a new chat");
  }, [startNewConversation]);

  useEffect(() => {
    const onApplyView = (event: Event) => {
      const detail = (event as CustomEvent<ApplyTaskViewDetail>).detail;
      if (!detail) return;
      router.push(buildTasksUrlFromView(detail));
    };
    const onStartNewChat = () => handleNewChat();

    window.addEventListener("todo:apply-task-view", onApplyView);
    window.addEventListener("todo:start-new-chat", onStartNewChat);
    return () => {
      window.removeEventListener("todo:apply-task-view", onApplyView);
      window.removeEventListener("todo:start-new-chat", onStartNewChat);
    };
  }, [handleNewChat, router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading, retainedOp]);

  const handleSend = useCallback(() => {
    if (!user) {
      toast.error("Please sign in to use the assistant");
      return;
    }
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    setRetainedOp(null);
    void sendMessage(trimmed);
    setInputText("");
  }, [inputText, isLoading, sendMessage, user]);

  const handleSelectSuggestion = (text: string) => {
    setInputText(text);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleViewTask = (taskId: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("task", String(taskId));
    const currentPath = pathname ?? "/today";
    const targetPath = currentPath === "/chat" ? "/today" : currentPath;
    router.push(`${targetPath}?${params.toString()}`, { scroll: false });
  };

  const handleViewFiltered = (view: TaskViewAction) => {
    router.push(buildTasksUrlFromView(view));
  };

  const visibleMessages = messages.filter(
    (m) => !(m.sender === "ai" && m.isStreaming && !m.text)
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div aria-live="polite" className="sr-only">
        {isLoading ? "Assistant is thinking" : "Assistant ready"}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {visibleMessages.length === 0 && !isLoading ? (
          <AssistantEmpty onSelectSuggestion={handleSelectSuggestion} />
        ) : (
          visibleMessages.map((msg) =>
            msg.sender === "user" ? (
              <UserMessage key={msg.id} text={msg.text} timestamp={msg.timestamp} />
            ) : (
              <AssistantMessage
                key={msg.id}
                text={msg.text}
                timestamp={msg.timestamp}
                isStreaming={msg.isStreaming}
              />
            )
          )
        )}

        {progressEvents.length > 0 ? (
          <ToolActivity events={progressEvents} isLoading={isLoading} />
        ) : null}

        {isLoading && progressEvents.length === 0 ? (
          <div className="pl-7">
            <TypingIndicator />
          </div>
        ) : null}

        {retainedOp ? (
          <ActionResultCard
            operation={retainedOp}
            onViewTask={handleViewTask}
            onViewFiltered={handleViewFiltered}
          />
        ) : null}

        <div ref={endRef} />
      </div>

      <AssistantComposer
        value={inputText}
        onChange={setInputText}
        onSend={handleSend}
        disabled={!isLoaded || !user}
        isLoading={isLoading}
        inputRef={inputRef}
      />
    </div>
  );
}

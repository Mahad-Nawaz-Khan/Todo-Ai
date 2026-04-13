"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useUser } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

/* ─── Types ─── */

type Message = {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isStreaming?: boolean;
};

type ChatInterfaceProps = {
  initialMessages?: Message[];
  onTaskUpdated?: () => void;
  variant?: "full" | "widget";
};

/* ─── Constants ─── */

const suggestions = [
  "Create a task to review the API docs tomorrow",
  "Show all my high priority tasks",
  "Mark my completed tasks as done",
];

/* ─── Helpers ─── */

function getOperationMeta(operation: unknown) {
  if (!operation || typeof operation !== "object") return null;

  const op = operation as { type?: string; count?: number; task_id?: number };
  const type = op.type?.toUpperCase() || "ACTION";

  if (type.includes("CREATE")) {
    return {
      label: "Created",
      detail: op.task_id
        ? `Task #${op.task_id} was created through the assistant.`
        : "A new task was created through the assistant.",
      icon: CheckCircle2,
      accent: "var(--success)",
      bg: "rgba(126,240,184,0.08)",
      border: "rgba(126,240,184,0.18)",
    };
  }
  if (type.includes("UPDATE") || type.includes("EDIT")) {
    return {
      label: "Updated",
      detail: op.task_id
        ? `Task #${op.task_id} was updated.`
        : "A task was updated through the assistant.",
      icon: PencilLine,
      accent: "var(--accent-ice)",
      bg: "rgba(144,229,255,0.08)",
      border: "rgba(144,229,255,0.18)",
    };
  }
  if (type.includes("DELETE")) {
    return {
      label: "Deleted",
      detail: op.task_id
        ? `Task #${op.task_id} was removed.`
        : "A task was deleted through the assistant.",
      icon: Trash2,
      accent: "var(--danger)",
      bg: "rgba(255,135,124,0.08)",
      border: "rgba(255,135,124,0.18)",
    };
  }
  if (type.includes("READ") || type.includes("SEARCH") || type.includes("LIST")) {
    return {
      label: "Searched",
      detail:
        typeof op.count === "number"
          ? `The assistant inspected ${op.count} matching task(s).`
          : "The assistant searched the task list.",
      icon: Search,
      accent: "var(--accent-amber)",
      bg: "rgba(248,197,108,0.08)",
      border: "rgba(248,197,108,0.18)",
    };
  }

  return {
    label: "Operation",
    detail: "The assistant completed a backend action successfully.",
    icon: Sparkles,
    accent: "var(--accent-ice)",
    bg: "rgba(144,229,255,0.08)",
    border: "rgba(144,229,255,0.18)",
  };
}

/* ─── Sub-components ─── */

const OperationCard = memo(function OperationCard({
  operation,
}: {
  operation: unknown;
}) {
  const meta = getOperationMeta(operation);
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="overflow-hidden rounded-[20px] border p-3.5"
      style={{ background: meta.bg, borderColor: meta.border }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${meta.accent}18`, border: `1px solid ${meta.accent}30` }}
        >
          <Icon className="size-4" style={{ color: meta.accent }} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{meta.label}</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">{meta.detail}</div>
        </div>
      </div>
    </motion.div>
  );
});

const ChatBubble = memo(function ChatBubble({
  message,
  formatMessage,
  isWidget,
}: {
  message: Message;
  formatMessage: (t: string) => React.ReactNode;
  isWidget: boolean;
}) {
  const isUser = message.sender === "user";
  const maxW = isWidget ? "max-w-[90%]" : "sm:max-w-[78%] max-w-[94%]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "rounded-[20px] px-3.5 py-2.5 text-sm sm:rounded-[22px] sm:px-4 sm:py-3",
          maxW,
          isUser
            ? "bg-[linear-gradient(135deg,var(--accent-blue),var(--accent-ice))] text-[#04121f]"
            : "border border-white/8 bg-[var(--bg-strong)] text-[var(--text-primary)]"
        )}
      >
        <div
          className={cn(
            "markdown-content text-[13px] leading-7",
            isWidget && "line-clamp-5"
          )}
        >
          {isUser ? formatMessage(message.text) : <ReactMarkdown>{message.text}</ReactMarkdown>}
        </div>
        <div
          className={cn(
            "mt-2 text-[10px] uppercase tracking-[0.22em]",
            isUser ? "text-[#0a2f4b]/60" : "text-[var(--text-faint)]"
          )}
        >
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </motion.div>
  );
});

const Composer = memo(function Composer({
  inputText,
  setInputText,
  onSend,
  isLoading,
  disabled,
  inputRef,
  compact,
  hint,
}: {
  inputText: string;
  setInputText: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  disabled: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  compact?: boolean;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-white/8 bg-[var(--bg-soft)]",
        compact ? "p-2" : "p-2.5 sm:p-3"
      )}
    >
      <textarea
        ref={inputRef}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={hint || "Ask the assistant to create, update, or find tasks..."}
        disabled={isLoading || disabled}
        className={cn(
          "w-full resize-none bg-transparent px-1 text-sm text-white outline-none placeholder:text-[var(--text-faint)] disabled:opacity-50",
          compact ? "min-h-[56px]" : "min-h-[72px] py-1"
        )}
        maxLength={5000}
      />
      <div className={cn("flex items-center justify-between gap-2", compact ? "mt-2" : "mt-3")}>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
          <Sparkles className="size-3.5 text-[var(--accent-ice)]" />
          {compact ? "Widget" : "Shift+Enter for new line"}
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={!inputText.trim() || isLoading || disabled}
          className="action-button-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:text-sm"
        >
          Send
          <ArrowUp className="size-3.5" />
        </button>
      </div>
    </div>
  );
});

/* ─── Main Component ─── */

const ChatInterface = ({
  initialMessages = [],
  onTaskUpdated,
  variant = "full",
}: ChatInterfaceProps) => {
  const {
    messages,
    sendMessage,
    isLoading,
    startNewConversation,
    formatMessage,
    sessionId,
    operationPerformed,
  } = useChat(initialMessages, {
    autoLoadHistory: !initialMessages.length,
    enableStreaming: true,
  });

  const [inputText, setInputText] = useState("");
  const [widgetOpen, setWidgetOpen] = useState(false);
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isWidget = variant === "widget";

  /* Derived */
  const shortSessionId = sessionId.slice(-8);
  const operationMeta = getOperationMeta(operationPerformed);
  const visibleMessages = isWidget ? messages.slice(-5) : messages;

  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Focus input on sign-in */
  useEffect(() => {
    if (userLoaded && user) inputRef.current?.focus();
  }, [userLoaded, user]);

  /* Handlers */
  const handleSend = useCallback(() => {
    if (!user) {
      toast.error("Please sign in to use chat");
      return;
    }
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText);
    setInputText("");
  }, [user, inputText, isLoading, sendMessage]);

  const handleNewConversation = useCallback(() => {
    startNewConversation();
    toast.success("Started a new chat session");
  }, [startNewConversation]);

  /* Global events */
  useEffect(() => {
    const onTasksUpdated = () => onTaskUpdated?.();
    const onStartNewChat = () => handleNewConversation();
    window.addEventListener("tasksUpdated", onTasksUpdated);
    window.addEventListener("todo:start-new-chat", onStartNewChat);
    return () => {
      window.removeEventListener("tasksUpdated", onTasksUpdated);
      window.removeEventListener("todo:start-new-chat", onStartNewChat);
    };
  }, [handleNewConversation, onTaskUpdated]);

  const navigateToChat = useCallback(() => router.push("/chat"), [router]);

  /* ─── Widget: Floating button + expandable panel ─── */
  if (isWidget) {
    return (
      <>
        {/* Floating trigger button */}
        <AnimatePresence>
          {!widgetOpen && (
            <motion.button
              key="widget-trigger"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={() => setWidgetOpen(true)}
              className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,var(--accent-blue),var(--accent-ice))] shadow-[0_8px_32px_rgba(74,167,255,0.35)] transition-shadow hover:shadow-[0_12px_40px_rgba(74,167,255,0.45)] sm:bottom-7 sm:right-7 sm:size-[60px] sm:rounded-[22px]"
              aria-label="Open AI assistant"
            >
              <MessageSquareText className="size-6 text-[#04121f] sm:size-7" />
              {messages.length > 0 && (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--accent-ice)] text-[10px] font-bold text-[#04121f]">
                  {messages.length}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Expanded widget panel */}
        <AnimatePresence>
          {widgetOpen && (
            <>
              {/* Backdrop (mobile) */}
              <motion.div
                key="widget-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-[rgba(6,8,14,0.5)] backdrop-blur-sm sm:hidden"
                onClick={() => setWidgetOpen(false)}
              />

              <motion.div
                key="widget-panel"
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className={cn(
                  "fixed z-50 flex flex-col overflow-hidden border border-white/10 bg-[var(--bg-elevated)] shadow-[0_24px_80px_rgba(0,0,0,0.5)]",
                  /* Mobile: full width bottom sheet */
                  "inset-x-0 bottom-0 h-[85vh] rounded-t-[28px] sm:rounded-[28px]",
                  /* Desktop: anchored bottom-right card */
                  "sm:inset-x-auto sm:bottom-7 sm:right-7 sm:top-auto sm:h-[540px] sm:w-[400px]"
                )}
              >
                {/* Widget header */}
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl border border-white/8 bg-white/6 text-[var(--accent-ice)]">
                      <Bot className="size-4" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">AI assistant</div>
                      <div className="text-[11px] text-[var(--text-faint)]">
                        Session {shortSessionId} &middot; {messages.length} messages
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleNewConversation}
                      className="action-button-secondary inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs"
                    >
                      <Plus className="size-3" /> New
                    </button>
                    <button
                      type="button"
                      onClick={navigateToChat}
                      className="action-button-secondary inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs"
                    >
                      <ArrowUp className="size-3 rotate-45" /> Full chat
                    </button>
                    <button
                      type="button"
                      onClick={() => setWidgetOpen(false)}
                      className="flex size-8 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-[var(--text-dim)] transition hover:bg-white/8 hover:text-white"
                      aria-label="Close widget"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Operation status (if active) */}
                {operationMeta && (
                  <div className="border-b border-white/8 px-4 py-3">
                    <OperationCard operation={operationPerformed} />
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                      <div className="flex size-16 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-[var(--accent-ice)] shadow-[0_0_40px_rgba(144,229,255,0.1)]">
                        <Sparkles className="size-7" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-white sm:text-lg">
                          Ask the assistant
                        </div>
                        <div className="mt-1.5 text-xs text-[var(--text-dim)] sm:text-sm">
                          Create, update, or search tasks with natural language.
                        </div>
                      </div>
                      <div className="grid w-full gap-2">
                        {suggestions.slice(0, 2).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setInputText(s)}
                            className="rounded-xl border border-white/8 bg-[var(--bg-strong)] px-3 py-2.5 text-left text-xs text-[var(--text-secondary)] transition hover:border-white/12 hover:bg-white/8 hover:text-white sm:text-sm"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <AnimatePresence initial={false} mode="popLayout">
                        {visibleMessages
                          .filter((m) => !(m.sender === "ai" && m.isStreaming && !m.text))
                          .map((m) => (
                            <ChatBubble
                              key={m.id}
                              message={m}
                              formatMessage={formatMessage}
                              isWidget
                            />
                          ))}
                      </AnimatePresence>
                      {isLoading &&
                        !messages.some((m) => m.sender === "ai" && m.isStreaming && m.text) && (
                          <div className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-[var(--bg-strong)] px-3 py-2 text-xs text-[var(--text-dim)]">
                            <LoaderCircle className="size-3.5 animate-spin text-[var(--accent-ice)]" />
                            Thinking...
                          </div>
                        )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Composer */}
                <div className="border-t border-white/8 p-3">
                  {!userLoaded ? (
                    <div className="py-3 text-center text-xs text-[var(--text-dim)]">
                      Loading chat access...
                    </div>
                  ) : !user ? (
                    <div className="py-3 text-center text-xs text-[var(--text-dim)]">
                      Please{" "}
                      <Link href="/sign-in" className="text-[var(--accent-ice)] underline">
                        sign in
                      </Link>{" "}
                      to use the assistant.
                    </div>
                  ) : (
                    <Composer
                      inputText={inputText}
                      setInputText={setInputText}
                      onSend={handleSend}
                      isLoading={isLoading}
                      disabled={false}
                      inputRef={inputRef}
                      compact
                      hint="Ask the assistant to act on your tasks..."
                    />
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  /* ─── Full chat workspace ─── */
  return (
    <div className="section-card flex h-full min-h-[560px] flex-col overflow-hidden rounded-[24px] sm:min-h-[640px] sm:rounded-[30px]">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-white/8 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-[var(--accent-ice)]">
            <Bot className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.04em] text-white sm:text-xl">
              AI chat workspace
            </h2>
            <p className="mt-1 text-xs text-[var(--text-dim)] sm:text-sm">
              Session {shortSessionId} &middot; {messages.length} messages
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleNewConversation}
          className="action-button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm"
        >
          <Plus className="size-4" /> New chat
        </button>
      </div>

      {/* Body: transcript + optional context panel */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Transcript */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:space-y-4 sm:px-6 sm:py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-5 py-12 text-center">
                <div className="flex size-20 items-center justify-center rounded-[28px] border border-white/8 bg-white/6 text-[var(--accent-ice)] shadow-[0_0_50px_rgba(144,229,255,0.12)]">
                  <MessageSquareText className="size-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                    Start with a task command
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-[var(--text-dim)]">
                    Use natural language to create, update, or search tasks without leaving the
                    workspace.
                  </p>
                </div>
                <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setInputText(s)}
                      className="rounded-[22px] border border-white/8 bg-[var(--bg-strong)] px-4 py-4 text-left text-sm text-[var(--text-secondary)] transition hover:border-white/12 hover:bg-white/8 hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages
                  .filter((m) => !(m.sender === "ai" && m.isStreaming && !m.text))
                  .map((m) => (
                    <ChatBubble
                      key={m.id}
                      message={m}
                      formatMessage={formatMessage}
                      isWidget={false}
                    />
                  ))}
              </AnimatePresence>
            )}

            {isLoading &&
              !messages.some((m) => m.sender === "ai" && m.isStreaming && m.text) && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-3 rounded-[22px] border border-white/8 bg-[var(--bg-strong)] px-4 py-3 text-sm text-[var(--text-dim)]">
                    <LoaderCircle className="size-4 animate-spin text-[var(--accent-ice)]" />
                    Thinking...
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-white/8 px-3 py-3 sm:px-6 sm:py-4"
          >
            {!userLoaded ? (
              <div className="py-4 text-center text-sm text-[var(--text-dim)]">
                Loading chat access...
              </div>
            ) : !user ? (
              <div className="py-4 text-center text-sm text-[var(--text-dim)]">
                Please{" "}
                <Link href="/sign-in" className="text-[var(--accent-ice)] underline">
                  sign in
                </Link>{" "}
                to use the assistant.
              </div>
            ) : (
              <Composer
                inputText={inputText}
                setInputText={setInputText}
                onSend={handleSend}
                isLoading={isLoading}
                disabled={false}
                inputRef={inputRef}
              />
            )}
          </form>
        </div>

        {/* Context panel (desktop only) */}
        <aside className="hidden border-l border-white/8 lg:flex lg:w-[300px] lg:flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {/* Session stats */}
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">
                Session
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-[18px] border border-white/8 bg-[var(--bg-soft)] px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
                    Messages
                  </div>
                  <div className="mt-1.5 text-lg font-semibold text-white">{messages.length}</div>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-[var(--bg-soft)] px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
                    Last activity
                  </div>
                  <div className="mt-1.5 text-sm font-semibold text-white">
                    {messages.length
                      ? messages[messages.length - 1]?.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Operation status */}
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">
                Last action
              </div>
              <div className="mt-3">
                {operationMeta ? (
                  <OperationCard operation={operationPerformed} />
                ) : (
                  <div className="rounded-[18px] border border-white/8 bg-[var(--bg-soft)] px-3 py-3 text-sm text-[var(--text-dim)]">
                    No task action performed in this session yet.
                  </div>
                )}
              </div>
            </div>

            {/* Raw payload */}
            {operationPerformed != null && (
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">
                  Raw payload
                </div>
                <div className="mt-3 overflow-hidden rounded-[18px] border border-white/8 bg-[var(--bg-soft)]">
                  <pre className="overflow-auto p-3 font-mono text-[11px] leading-5 text-[var(--text-secondary)]">
                    {JSON.stringify(operationPerformed, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ChatInterface;

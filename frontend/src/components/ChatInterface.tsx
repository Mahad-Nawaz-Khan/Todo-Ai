"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Bot, CheckCircle2, LoaderCircle, MessageSquareText, PencilLine, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useUser } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";

type Message = {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
};

type ChatInterfaceProps = {
  initialMessages?: Message[];
  onTaskUpdated?: () => void;
  variant?: "full" | "widget";
};

const suggestions = [
  "Create a task to review the API docs tomorrow",
  "Show all my high priority tasks",
  "Mark my completed tasks as done",
];

function getOperationMeta(operation: unknown) {
  if (!operation || typeof operation !== "object") {
    return null;
  }

  const op = operation as { type?: string; count?: number; task_id?: number };
  const type = op.type?.toUpperCase() || "ACTION";

  if (type.includes("CREATE")) {
    return {
      label: "Created",
      detail: op.task_id ? `Task #${op.task_id} was created through the assistant.` : "A new task was created through the assistant.",
      icon: CheckCircle2,
      tone: "text-[var(--success)] bg-[rgba(126,240,184,0.08)] border-[rgba(126,240,184,0.16)]",
    };
  }

  if (type.includes("UPDATE") || type.includes("EDIT")) {
    return {
      label: "Updated",
      detail: op.task_id ? `Task #${op.task_id} was updated.` : "A task was updated through the assistant.",
      icon: PencilLine,
      tone: "text-[var(--accent-ice)] bg-[rgba(144,229,255,0.08)] border-[rgba(144,229,255,0.16)]",
    };
  }

  if (type.includes("DELETE")) {
    return {
      label: "Deleted",
      detail: op.task_id ? `Task #${op.task_id} was removed.` : "A task was deleted through the assistant.",
      icon: Trash2,
      tone: "text-[#ffd4cf] bg-[rgba(255,135,124,0.08)] border-[rgba(255,135,124,0.16)]",
    };
  }

  if (type.includes("READ") || type.includes("SEARCH") || type.includes("LIST")) {
    return {
      label: "Searched",
      detail: typeof op.count === "number" ? `The assistant inspected ${op.count} matching task(s).` : "The assistant searched the task list.",
      icon: Search,
      tone: "text-[var(--accent-amber)] bg-[rgba(248,197,108,0.08)] border-[rgba(248,197,108,0.16)]",
    };
  }

  return {
    label: "Operation",
    detail: "The assistant completed a backend action successfully.",
    icon: Sparkles,
    tone: "text-[var(--accent-ice)] bg-[rgba(144,229,255,0.08)] border-[rgba(144,229,255,0.16)]",
  };
}

const ChatInterface = ({ initialMessages = [], onTaskUpdated, variant = "full" }: ChatInterfaceProps) => {
  const { messages, sendMessage, isLoading, startNewConversation, formatMessage, sessionId, operationPerformed } = useChat(initialMessages, {
    autoLoadHistory: !initialMessages.length,
    enableStreaming: true,
  });

  const [inputText, setInputText] = useState("");
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isWidget = variant === "widget";
  const recentMessages = isWidget ? messages.slice(-4) : messages;
  const assistantPreview = messages.filter((message) => message.sender === "ai" && message.text.trim()).slice(-1)[0] ?? null;
  const totalAssistantMessages = messages.filter((message) => message.sender === "ai").length;
  const totalUserMessages = messages.filter((message) => message.sender === "user").length;
  const widgetSuggestions = suggestions.slice(0, 2);
  const widgetMessageCountLabel = `${messages.length} ${messages.length === 1 ? "message" : "messages"}`;
  const lastUpdatedLabel = messages.length ? messages[messages.length - 1]?.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;

  const handleOpenFullChat = useCallback(() => {
    router.push("/chat");
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = useCallback(() => {
    startNewConversation();
    toast.success("Started a new chat session");
  }, [startNewConversation]);

  useEffect(() => {
    const handleTasksUpdated = () => {
      onTaskUpdated?.();
    };

    window.addEventListener("tasksUpdated", handleTasksUpdated);
    window.addEventListener("todo:start-new-chat", handleNewConversation);
    return () => {
      window.removeEventListener("tasksUpdated", handleTasksUpdated);
      window.removeEventListener("todo:start-new-chat", handleNewConversation);
    };
  }, [handleNewConversation, onTaskUpdated]);

  useEffect(() => {
    if (userLoaded && user) {
      inputRef.current?.focus();
    }
  }, [userLoaded, user]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!user) {
      toast.error("Please sign in to use chat");
      return;
    }

    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText);
    setInputText("");
  };

  const operationMeta = getOperationMeta(operationPerformed);

  if (isWidget) {
    return (
      <div className="section-card flex h-full flex-col overflow-hidden rounded-[24px] p-0 sm:rounded-[28px]">
        <div className="border-b border-white/8 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-[var(--accent-ice)]">
                  <Bot className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-[-0.04em] text-white">AI widget</h2>
                  <p className="mt-1 text-xs text-[var(--text-dim)]">Session {sessionId.slice(-8)} · {widgetMessageCountLabel}</p>
                </div>
              </div>
            </div>
            <button type="button" onClick={handleOpenFullChat} className="action-button-secondary inline-flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-xs sm:text-sm">
              Open chat <ArrowUp className="size-3.5 rotate-45" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
          <div className="min-w-0 space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-[var(--accent-ice)]">
                    <MessageSquareText className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Start with a task prompt</div>
                    <div className="mt-1 text-xs text-[var(--text-dim)]">Create, update, or search tasks here, then jump into the full chat workspace when needed.</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {widgetSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInputText(suggestion)}
                      className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:border-white/12 hover:bg-white/8 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {recentMessages
                    .filter((message) => !(message.sender === "ai" && message.isStreaming && !message.text))
                    .map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[92%] rounded-[18px] px-3 py-2.5 text-sm ${message.sender === "user" ? "bg-[linear-gradient(135deg,rgba(74,167,255,0.92),rgba(144,229,255,0.72))] text-[#04121f]" : "border border-white/8 bg-white/5 text-white"}`}>
                          <div className="markdown-content line-clamp-4 leading-6">
                            {message.sender === "ai" ? <ReactMarkdown>{message.text}</ReactMarkdown> : formatMessage(message.text)}
                          </div>
                          <div className={`mt-2 text-[10px] uppercase tracking-[0.22em] ${message.sender === "user" ? "text-[#0a2f4b]/70" : "text-[var(--text-faint)]"}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading ? (
                  <div className="inline-flex items-center gap-2 rounded-[18px] border border-white/8 bg-white/5 px-3 py-2 text-xs text-[var(--text-dim)]">
                    <LoaderCircle className="size-3.5 animate-spin text-[var(--accent-ice)]" /> Thinking...
                  </div>
                ) : null}
              </div>
            )}

            <form onSubmit={handleSend} className="rounded-[22px] border border-white/8 bg-white/4 p-2.5">
              {!userLoaded ? (
                <div className="py-4 text-center text-sm text-[var(--text-dim)]">Loading chat access...</div>
              ) : !user ? (
                <div className="py-4 text-center text-sm text-[var(--text-dim)]">
                  Please <Link href="/sign-in" className="text-[var(--accent-ice)] underline">sign in</Link> to use the assistant.
                </div>
              ) : (
                <>
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask the assistant to act on your tasks..."
                    disabled={isLoading}
                    className="min-h-[88px] w-full resize-none bg-transparent px-1 py-1 text-sm text-white outline-none placeholder:text-[var(--text-faint)] disabled:opacity-60"
                    maxLength={5000}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-faint)]">
                      <Sparkles className="size-4 text-[var(--accent-ice)]" /> Widget composer
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleNewConversation} className="action-button-secondary inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs sm:text-sm">
                        <Plus className="size-3.5" /> New
                      </button>
                      <button type="submit" disabled={!inputText.trim() || isLoading} className="action-button-primary inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm">
                        Send <ArrowUp className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>

          <aside className="space-y-3">
            <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">Live context</div>
              <div className="mt-3 text-base font-semibold tracking-[-0.03em] text-white">Assistant snapshot</div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-faint)]">Messages</div>
                  <div className="mt-2 text-lg font-semibold text-white">{messages.length}</div>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-faint)]">Assistant</div>
                  <div className="mt-2 text-lg font-semibold text-white">{totalAssistantMessages}</div>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-faint)]">Updated</div>
                  <div className="mt-2 text-sm font-semibold text-white">{lastUpdatedLabel ?? "—"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">Latest reply</div>
              <div className="mt-3 rounded-[18px] border border-white/8 bg-black/18 p-3 text-sm text-[var(--text-secondary)]">
                {assistantPreview ? (
                  <div className="markdown-content line-clamp-6 leading-6 text-white/88">
                    <ReactMarkdown>{assistantPreview.text}</ReactMarkdown>
                  </div>
                ) : (
                  <span>No assistant reply yet in this session.</span>
                )}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">Operation status</div>
              <div className="mt-3 rounded-[18px] border border-white/8 bg-black/18 p-3 text-sm text-[var(--text-secondary)]">
                {operationMeta ? (
                  <div className="space-y-3">
                    <div className={`rounded-[18px] border px-3 py-3 ${operationMeta.tone}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-9 items-center justify-center rounded-2xl border border-current/20 bg-current/10">
                          <operationMeta.icon className="size-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{operationMeta.label}</div>
                          <div className="mt-1 text-sm text-[var(--text-secondary)]">{operationMeta.detail}</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-white/4 px-3 py-3">
                      <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-[var(--text-faint)]">User prompts</div>
                      <div className="text-white">{totalUserMessages}</div>
                    </div>
                  </div>
                ) : (
                  <span>No task action has been performed in this session yet.</span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="section-card flex h-full min-h-[560px] flex-col overflow-hidden rounded-[24px] sm:min-h-[640px] sm:rounded-[30px]">
      <div className="flex flex-col gap-3 border-b border-white/8 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-[var(--accent-ice)]">
              <Bot className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">AI chat workspace</h2>
              <p className="mt-1 text-sm text-[var(--text-dim)]">Session {sessionId.slice(-8)} · {messages.length} messages</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleNewConversation} className="action-button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm">
            <Plus className="size-4" /> New chat
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:space-y-4 sm:px-6 sm:py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-5 py-12 text-center">
                <div className="flex size-20 items-center justify-center rounded-[28px] border border-white/8 bg-white/6 text-[var(--accent-ice)] shadow-[0_0_50px_rgba(144,229,255,0.12)]">
                  <MessageSquareText className="size-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">Start with a task command</h3>
                  <p className="mt-2 max-w-md text-sm text-[var(--text-dim)]">Use natural language to create, update, or search tasks without leaving the workspace.</p>
                </div>
                <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInputText(suggestion)}
                      className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4 text-left text-sm text-[var(--text-secondary)] transition hover:border-white/12 hover:bg-white/8 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages
                  .filter((message) => !(message.sender === "ai" && message.isStreaming && !message.text))
                  .map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[96%] rounded-[20px] px-3.5 py-3 sm:max-w-[80%] sm:rounded-[24px] sm:px-4 sm:py-4 ${message.sender === "user" ? "bg-[linear-gradient(135deg,rgba(74,167,255,0.92),rgba(144,229,255,0.72))] text-[#04121f]" : "border border-white/8 bg-white/5 text-white"}`}>
                        <div className="markdown-content text-sm leading-7">
                          {message.sender === "ai" ? <ReactMarkdown>{message.text}</ReactMarkdown> : formatMessage(message.text)}
                        </div>
                        <div className={`mt-3 text-[11px] uppercase tracking-[0.24em] ${message.sender === "user" ? "text-[#0a2f4b]/70" : "text-[var(--text-faint)]"}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            )}

            {isLoading && !messages.some((m) => m.sender === "ai" && m.isStreaming && m.text) ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-[var(--text-dim)]">
                  <LoaderCircle className="size-4 animate-spin text-[var(--accent-ice)]" /> Thinking...
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-white/8 px-3 py-3 sm:px-6 sm:py-4">
            {!userLoaded ? (
              <div className="py-4 text-center text-sm text-[var(--text-dim)]">Loading chat access...</div>
            ) : !user ? (
              <div className="py-4 text-center text-sm text-[var(--text-dim)]">
                Please <Link href="/sign-in" className="text-[var(--accent-ice)] underline">sign in</Link> to use the assistant.
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/8 bg-white/4 p-2.5 sm:rounded-[26px] sm:p-3">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask the assistant to create, update, or find tasks..."
                  disabled={isLoading}
                  className="min-h-[84px] w-full resize-none bg-transparent px-1 py-1 text-sm text-white outline-none placeholder:text-[var(--text-faint)] disabled:opacity-60"
                  maxLength={5000}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-faint)]">
                    <Sparkles className="size-4 text-[var(--accent-ice)]" /> Shift+Enter for a new line
                  </div>
                  <button type="submit" disabled={!inputText.trim() || isLoading} className="action-button-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                    Send <ArrowUp className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <aside className="border-t border-white/8 px-3 py-3 sm:px-6 sm:py-4 lg:w-[320px] lg:border-l lg:border-t-0">
          <div className="rounded-[22px] border border-white/8 bg-white/4 p-3.5 sm:rounded-[26px] sm:p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">Live context</div>
            <div className="mt-3 text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">Operation status</div>
            <p className="mt-2 text-sm text-[var(--text-dim)]">The assistant will update tasks through the existing backend workflow and refresh the dashboard automatically.</p>
            <div className="mt-4 rounded-[20px] border border-white/8 bg-black/18 p-3.5 text-sm text-[var(--text-secondary)] sm:rounded-[22px] sm:p-4">
              {operationMeta ? (
                <div className="space-y-3">
                  <div className={`rounded-[18px] border px-3 py-3 ${operationMeta.tone}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-9 items-center justify-center rounded-2xl border border-current/20 bg-current/10">
                        <operationMeta.icon className="size-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{operationMeta.label}</div>
                        <div className="mt-1 text-sm text-[var(--text-secondary)]">{operationMeta.detail}</div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-white/4 px-3 py-3">
                    <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-[var(--text-faint)]">Raw payload</div>
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs text-[var(--text-secondary)]">{JSON.stringify(operationPerformed, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <span>No task action has been performed in this session yet.</span>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ChatInterface;

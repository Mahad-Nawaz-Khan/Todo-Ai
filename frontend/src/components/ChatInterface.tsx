"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Bot, LoaderCircle, MessageSquareText, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
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
};

const suggestions = [
  "Create a task to review the API docs tomorrow",
  "Show all my high priority tasks",
  "Mark my completed tasks as done",
];

const ChatInterface = ({ initialMessages = [], onTaskUpdated }: ChatInterfaceProps) => {
  const { messages, sendMessage, isLoading, startNewConversation, formatMessage, sessionId, operationPerformed } = useChat(initialMessages, {
    autoLoadHistory: !initialMessages.length,
    enableStreaming: true,
  });

  const [inputText, setInputText] = useState("");
  const { user, isLoaded: userLoaded } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="section-card flex h-full min-h-[640px] flex-col overflow-hidden rounded-[30px]">
      <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
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
                      <div className={`max-w-[92%] rounded-[24px] px-4 py-4 sm:max-w-[80%] ${message.sender === "user" ? "bg-[linear-gradient(135deg,rgba(74,167,255,0.92),rgba(144,229,255,0.72))] text-[#04121f]" : "border border-white/8 bg-white/5 text-white"}`}>
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

          <form onSubmit={handleSend} className="border-t border-white/8 px-4 py-4 sm:px-6">
            {!userLoaded ? (
              <div className="py-4 text-center text-sm text-[var(--text-dim)]">Loading chat access...</div>
            ) : !user ? (
              <div className="py-4 text-center text-sm text-[var(--text-dim)]">
                Please <Link href="/sign-in" className="text-[var(--accent-ice)] underline">sign in</Link> to use the assistant.
              </div>
            ) : (
              <div className="rounded-[26px] border border-white/8 bg-white/4 p-3">
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

        <aside className="border-t border-white/8 px-4 py-4 sm:px-6 lg:w-[320px] lg:border-l lg:border-t-0">
          <div className="rounded-[26px] border border-white/8 bg-white/4 p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">Live context</div>
            <div className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">Operation status</div>
            <p className="mt-2 text-sm text-[var(--text-dim)]">The assistant will update tasks through the existing backend workflow and refresh the dashboard automatically.</p>
            <div className="mt-4 rounded-[22px] border border-white/8 bg-black/18 p-4 text-sm text-[var(--text-secondary)]">
              {operationPerformed ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-[var(--text-secondary)]">{JSON.stringify(operationPerformed, null, 2)}</pre>
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

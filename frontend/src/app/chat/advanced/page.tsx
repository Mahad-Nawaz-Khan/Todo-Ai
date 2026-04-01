"use client";

import { useState } from "react";

import ChatInterface from "@/components/ChatInterface";

const demoMessages = [
  {
    id: "1",
    text: "Hello! I can help manage tasks, tags, and workflow planning.",
    sender: "ai" as const,
    timestamp: new Date("2024-01-01T12:00:00.000Z"),
  },
  {
    id: "2",
    text: "Great. Show me how the redesigned interface behaves with history.",
    sender: "user" as const,
    timestamp: new Date("2024-01-01T12:01:00.000Z"),
  },
  {
    id: "3",
    text: "This lab page previews the same chat component in different states while preserving the production service contract.",
    sender: "ai" as const,
    timestamp: new Date("2024-01-01T12:02:00.000Z"),
  },
];

export default function AdvancedChatPage() {
  const [mode, setMode] = useState<"demo" | "empty">("demo");

  return (
    <div className="grid gap-4">
      <div className="section-card rounded-[28px] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">Chat lab</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Preview different chat states</h2>
            <p className="mt-2 text-sm text-[var(--text-dim)]">Use this page to inspect the UI with seeded history or a fresh conversation shell.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode("demo")} className={`rounded-2xl px-4 py-2.5 text-sm ${mode === "demo" ? "action-button-primary" : "action-button-secondary"}`}>
              Demo history
            </button>
            <button onClick={() => setMode("empty")} className={`rounded-2xl px-4 py-2.5 text-sm ${mode === "empty" ? "action-button-primary" : "action-button-secondary"}`}>
              Empty state
            </button>
          </div>
        </div>
      </div>
      <ChatInterface initialMessages={mode === "demo" ? demoMessages : []} />
    </div>
  );
}

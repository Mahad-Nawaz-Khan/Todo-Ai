"use client";

import { ArrowRight, CheckCheck, Command, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import AppShell from "@/components/AppShell";
import ChatInterface from "@/components/ChatInterface";
import TagList from "@/components/TagList";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { useAuth } from "@/context/AuthContext";
import type { Task } from "@/types/task";

const showcaseCards = [
  {
    title: "Command-first workflow",
    description: "Keyboard-first task control inspired by fast developer tools and launchers.",
    icon: Command,
  },
  {
    title: "AI-assisted execution",
    description: "Talk to the assistant to create, update, and search tasks through the live backend.",
    icon: MessageSquareText,
  },
  {
    title: "Private by design",
    description: "Sessions, profile data, and task state stay scoped to the signed-in account.",
    icon: ShieldCheck,
  },
];

const previewTasks = [
  { title: "Refine the mobile command menu", priority: "HIGH", detail: "Make the phone experience feel native-speed." },
  { title: "Run end-to-end auth checks", priority: "MEDIUM", detail: "Validate session refresh and token flow." },
  { title: "Tune task micro-interactions", priority: "LOW", detail: "Polish hover, completion, and edit motion." },
];

export default function Dashboard() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  const userLabel = useMemo(() => user?.firstName || user?.name || user?.email || "User", [user]);

  if (!isLoaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-(--bg-main) text-(--text-dim)">
        Loading workspace...
      </div>
    );
  }

  const handleTaskCreated = (newTask: Task) => {
    setCreatedTask(newTask);
  };

  if (!isSignedIn) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-(--bg-main) text-(--text-primary)">
        <div className="aurora-grid" />
        <div className="noise-overlay" />
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-8 lg:px-12">
          <div className="glass-panel rounded-[34px] border border-white/8 px-5 py-5 md:px-8 md:py-8">
            <header className="flex flex-col gap-4 border-b border-white/8 pb-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-(--accent-ice)">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.3em] text-(--text-faint)">Todo AI</div>
                  <div className="text-lg font-semibold tracking-[-0.03em] text-white">Command Center</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/sign-in" className="action-button-secondary rounded-2xl px-4 py-2.5 text-sm">
                  Sign in
                </Link>
                <Link href="/sign-up" className="action-button-primary rounded-2xl px-4 py-2.5 text-sm">
                  Create account
                </Link>
              </div>
            </header>

            <main className="grid gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-12">
              <div>
                <div className="animate-fade-in-up">
                  
                  <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[0.95] tracking-[-0.08em] text-white md:text-5xl lg:text-7xl">
                    A task workspace built like a developer command surface.
                  </h1>
                  <p className="mt-6 max-w-2xl text-base leading-7 text-(--text-dim) md:text-lg">
                    Capture tasks, manage tags, and operate through an AI assistant in a refined dark interface designed for speed, clarity, and exceptional mobile UX.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 md:flex-row">
                    <Link href="/sign-up" className="btn-press action-button-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm">
                      Start free <ArrowRight className="size-4" />
                    </Link>
                    <Link href="/sign-in" className="btn-press action-button-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm">
                      I already have an account
                    </Link>
                  </div>
                </div>

                <div className="mt-8 grid gap-3 md:grid-cols-3 stagger-children">
                  {showcaseCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.title} className="card-lift section-card animate-fade-in-up rounded-[26px] p-5">
                        <div className="icon-glow flex size-11 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-(--accent-ice)">
                          <Icon className="size-5" />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white">{card.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-(--text-dim)">{card.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card-lift section-card animate-fade-in-scale rounded-[30px] p-5 md:p-6" style={{ animationDelay: "0.35s" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.28em] text-(--text-faint)">Live preview</div>
                    <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">{"Today\u2019s queue"}</div>
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/6 px-3 py-1 text-xs text-(--text-dim)">Mobile ready</div>
                </div>
                <div className="mt-5 space-y-3">
                  {previewTasks.map((task) => (
                    <div key={task.title} className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-medium text-white">{task.title}</div>
                          <div className="mt-2 text-sm text-(--text-dim)">{task.detail}</div>
                        </div>
                        <span className={`status-pill rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${task.priority === "HIGH" ? "priority-high" : task.priority === "MEDIUM" ? "priority-medium" : "priority-low"}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-[24px] border border-white/8 bg-black/16 p-4 text-sm text-(--text-dim)">
                  <div className="flex items-center gap-2 text-white">
                    <CheckCheck className="size-4 text-(--accent-lime)" /> Use the assistant to create and update tasks without touching the backend contract.
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title={`Welcome back, ${userLabel}`}
      subtitle="A command-first task workspace with fast capture, live filtering, and AI-assisted execution."
      signedIn
      userLabel={userLabel}
    >
      <div className="grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,1.5fr)_400px]">
        <div className="min-w-0">
          <TaskList createdTask={createdTask} />
        </div>
        <div className="min-w-0 space-y-4">
          <TaskForm onTaskCreated={handleTaskCreated} />
          <TagList />
        </div>
      </div>
      <ChatInterface initialMessages={[]} variant="widget" />
    </AppShell>
  );
}

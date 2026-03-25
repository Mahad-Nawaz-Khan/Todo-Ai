"use client";

import Link from "next/link";
import { useState } from "react";

import ChatInterface from "../components/ChatInterface";
import ProfileMenu from "../components/ProfileMenu";
import TagList from "../components/TagList";
import { TaskForm } from "../components/TaskForm";
import { TaskList } from "../components/TaskList";
import { useAuth } from "@/context/AuthContext";
import type { Task } from "@/types/task";

export default function Dashboard() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  if (!isLoaded) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  const handleTaskCreated = (newTask: Task) => {
    setCreatedTask(newTask);
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <header className="flex items-center justify-between">
            <div className="font-semibold tracking-tight">TODO</div>
            <div className="flex items-center gap-3">
              <Link href="/sign-in" className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15">
                Sign in
              </Link>
              <Link href="/sign-up" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium hover:bg-blue-600">
                Sign up
              </Link>
            </div>
          </header>

          <main className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">Your tasks, organized.</h1>
              <p className="mt-5 max-w-prose text-base text-white/70 md:text-lg">
                Sign in with Google or GitHub to manage tasks, priorities, due dates, and tags.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="rounded-lg bg-blue-500 px-5 py-3 text-center font-medium hover:bg-blue-600">
                  Get started
                </Link>
                <Link href="/sign-in" className="rounded-lg border border-white/15 bg-white/10 px-5 py-3 text-center font-medium hover:bg-white/15">
                  I already have an account
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-4 text-sm text-white/70 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-white">Private</div>
                  <div className="mt-1">Tasks stay scoped to your account.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-white">Fast</div>
                  <div className="mt-1">Create, edit, and delete in seconds.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-white">Reliable</div>
                  <div className="mt-1">Use the same data after signing in again.</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-medium text-white/80">Preview</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">Finish backend integration</div>
                      <div className="text-sm text-white/60">Connect API and auth headers</div>
                    </div>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-1 text-xs text-blue-200">HIGH</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">Plan tomorrow</div>
                      <div className="text-sm text-white/60">Add due date + tags</div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/70">MEDIUM</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">Refactor UI</div>
                      <div className="text-sm text-white/60">Improve spacing and typography</div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/70">LOW</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <footer className="mt-16 text-xs text-white/40">Built with Next.js + Passport</footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-tight">TODO</div>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Welcome, {user?.firstName || user?.name || user?.email || "User"}!</h1>
            <p className="mt-2 text-white/70">Manage your tasks below.</p>
          </div>
          <div className="flex items-center gap-3">
            <ProfileMenu />
          </div>
        </header>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TaskList createdTask={createdTask} />
          </div>
          <div className="space-y-6">
            <TaskForm onTaskCreated={handleTaskCreated} />
            <TagList />
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 font-medium text-white">Quick Chat</h3>
              <ChatInterface initialMessages={[]} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

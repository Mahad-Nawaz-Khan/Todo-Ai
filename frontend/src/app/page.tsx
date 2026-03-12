"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useState } from "react";
import { TaskList } from "../components/TaskList";
import { TaskForm } from "../components/TaskForm";
import TagList from "../components/TagList";
import ChatInterface from "../components/ChatInterface";

export default function Dashboard() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [createdTask, setCreatedTask] = useState(null);

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  const handleTaskCreated = (newTask: any) => {
    setCreatedTask(newTask);
  };

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <header className="flex items-center justify-between">
              <div className="font-semibold tracking-tight">TODO</div>
              <div className="flex items-center gap-3">
                <SignInButton mode="modal">
                  <button className="rounded-lg px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/15">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-lg px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600">
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            </header>

            <main className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Your tasks, organized.
                </h1>
                <p className="mt-5 text-base md:text-lg text-white/70 max-w-prose">
                  Sign in to manage tasks, priorities, due dates, and tags.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <SignUpButton mode="modal">
                    <button className="rounded-lg px-5 py-3 font-medium bg-blue-500 hover:bg-blue-600">
                      Get started
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button className="rounded-lg px-5 py-3 font-medium bg-white/10 hover:bg-white/15 border border-white/15">
                      I already have an account
                    </button>
                  </SignInButton>
                </div>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-white/70">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">Private</div>
                    <div className="mt-1">Tasks are scoped to your account.</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">Fast</div>
                    <div className="mt-1">Create, edit, delete in seconds.</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">Reliable</div>
                    <div className="mt-1">Secure cloud-based storage.</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-medium text-white/80">Preview</div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">Finish backend integration</div>
                        <div className="text-sm text-white/60">Connect API and auth headers</div>
                      </div>
                      <span className="text-xs rounded-full px-2 py-1 bg-blue-500/20 text-blue-200 border border-blue-500/30">HIGH</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">Plan tomorrow</div>
                        <div className="text-sm text-white/60">Add due date + tags</div>
                      </div>
                      <span className="text-xs rounded-full px-2 py-1 bg-white/10 text-white/70 border border-white/10">MEDIUM</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-black/20 border border-white/10 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">Refactor UI</div>
                        <div className="text-sm text-white/60">Improve spacing and typography</div>
                      </div>
                      <span className="text-xs rounded-full px-2 py-1 bg-white/10 text-white/70 border border-white/10">LOW</span>
                    </div>
                  </div>
                </div>
              </div>
            </main>

            <footer className="mt-16 text-xs text-white/40">
              Built with Next.js + Clerk
            </footer>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <header className="mb-10 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold tracking-tight">TODO</div>
                <h1 className="mt-3 text-3xl md:text-4xl font-bold">
                  Welcome, {user?.firstName || user?.username || "User"}!
                </h1>
                <p className="mt-2 text-white/70">Manage your tasks below.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TaskList createdTask={createdTask} />
              </div>
              <div className="space-y-6">
                <TaskForm onTaskCreated={handleTaskCreated} />
                <TagList />
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-medium text-white mb-3">Quick Chat</h3>
                  <ChatInterface initialMessages={[]} />
                </div>
              </div>
            </main>
          </div>
        </div>
      </SignedIn>
    </>
  );
}

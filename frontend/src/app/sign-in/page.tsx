"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <div className="mb-5">
            <div className="text-sm font-semibold tracking-tight">TODO</div>
            <h1 className="mt-2 text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-white/70">Sign in to manage your tasks.</p>
          </div>
          <SignIn />
        </div>
      </div>
    </div>
  );
}
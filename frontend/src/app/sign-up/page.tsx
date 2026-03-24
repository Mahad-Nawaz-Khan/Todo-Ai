"use client";

import Link from "next/link";

const providers = [
  { id: "google", label: "Sign up with Google", href: "/api/auth/google" },
  { id: "github", label: "Sign up with GitHub", href: "/api/auth/github" },
] as const;

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <div className="mb-6">
            <div className="text-sm font-semibold tracking-tight">TODO</div>
            <h1 className="mt-2 text-2xl font-bold">Create your account</h1>
            <p className="mt-1 text-sm text-white/70">Use Google or GitHub. Existing data is linked to the same email.</p>
          </div>

          <div className="space-y-3">
            {providers.map((provider) => (
              <a
                key={provider.id}
                href={provider.href}
                className="flex w-full items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
              >
                {provider.label}
              </a>
            ))}
          </div>

          <p className="mt-5 text-center text-sm text-white/60">
            Already have an account? <Link href="/sign-in" className="text-blue-300 hover:text-blue-200">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

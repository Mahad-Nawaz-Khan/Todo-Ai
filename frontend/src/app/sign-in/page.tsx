"use client";

import { ArrowLeft, Eye, EyeOff, Globe, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

function getErrorMessage(error: string | undefined) {
  switch (error) {
    case "google_auth_failed":
      return "Google sign-in failed. Please try again.";
    case "github_auth_failed":
      return "GitHub sign-in failed. Please try again.";
    case "email_auth_failed":
      return "Invalid email or password.";
    default:
      return null;
  }
}

const providers = [
  { id: "google", label: "Continue with Google", href: "/api/auth/google" },
  { id: "github", label: "Continue with GitHub", href: "/api/auth/github" },
] as const;

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlError(getErrorMessage(params.get("error") ?? undefined));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/email/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Login failed");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">
      <div className="aurora-grid" />
      <div className="noise-overlay" />
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="section-card animate-fade-in-up order-2 rounded-[32px] p-6 sm:p-8 lg:order-1 lg:min-h-[760px]">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] transition hover:text-white">
              <ArrowLeft className="size-4" /> Back to home
            </Link>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">
              <Sparkles className="size-3.5 text-[var(--accent-ice)]" /> Sign in
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.07em] text-white sm:text-5xl">Return to your command center.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-dim)]">
              Continue with your existing account and pick up the same tasks, tags, and AI chat workflows instantly.
            </p>
            <div className="mt-10 grid gap-3">
              {[
                "Keep the existing session and app token flow.",
                "Open the redesigned mobile-first dashboard immediately after login.",
                "Use AI chat to create, update, and search tasks with the same backend contract.",
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 text-sm text-[var(--text-secondary)]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel animate-fade-in-scale order-1 rounded-[32px] border border-white/8 p-6 sm:p-8 lg:order-2">
            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-faint)]">Todo AI</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-[var(--text-dim)]">Sign in with a provider or your email account.</p>
            </div>

            {error || urlError ? (
              <div className="error-banner mb-5 rounded-2xl border border-[rgba(255,135,124,0.24)] bg-[rgba(255,135,124,0.08)] px-4 py-3 text-sm text-[#ffd4cf]">{error || urlError}</div>
            ) : null}

            <div className="space-y-3 stagger-children">
              {providers.map((provider) => (
                <a key={provider.id} href={provider.href} className="btn-press action-button-secondary flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-sm animate-fade-in-up-sm">
                  <span className="flex items-center gap-3">
                    {provider.id === "google" ? <Mail className="size-4" /> : <Globe className="size-4" />}
                    {provider.label}
                  </span>
                  <Sparkles className="size-4 text-[var(--text-faint)]" />
                </a>
              ))}
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">or use email</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Email</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-shell w-full rounded-[22px] px-4 py-3 text-sm" />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Password</label>
                <div className="input-shell flex items-center rounded-[22px] px-4 py-3">
                  <input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-faint)]" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[var(--text-faint)] transition hover:text-white">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-press action-button-primary flex w-full items-center justify-center rounded-[22px] px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Signing in..." : "Sign in with email"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-dim)]">
              Need an account? <Link href="/sign-up" className="text-[var(--accent-ice)] underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

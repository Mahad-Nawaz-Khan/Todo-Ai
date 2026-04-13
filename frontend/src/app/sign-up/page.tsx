"use client";

import { ArrowLeft, Eye, EyeOff, Globe, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

const providers = [
  { id: "google", label: "Sign up with Google", href: "/api/auth/google" },
  { id: "github", label: "Sign up with GitHub", href: "/api/auth/github" },
] as const;

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/email/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName || null,
          last_name: lastName || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Sign up failed");
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
        <div className="grid w-full gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="section-card animate-fade-in-up order-2 rounded-[32px] p-6 sm:p-8 lg:order-1 lg:min-h-[760px]">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)] transition hover:text-white">
              <ArrowLeft className="size-4" /> Back to home
            </Link>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">
              <Sparkles className="size-3.5 text-[var(--accent-ice)]" /> Create account
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.07em] text-white sm:text-5xl">Build your task command center in minutes.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-dim)]">
              Create an account and get immediate access to the redesigned dashboard, mobile-first task flows, and AI chat controls.
            </p>
            <div className="mt-10 grid gap-3">
              {[
                "Keep your tasks, tags, and chat sessions aligned with the current backend mapping.",
                "Get a premium mobile and desktop interface from the first login.",
                "Use the command palette and assistant for faster daily execution.",
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 text-sm text-[var(--text-secondary)]">{item}</div>
              ))}
            </div>
          </div>

          <div className="glass-panel animate-fade-in-scale order-1 rounded-[32px] border border-white/8 p-6 sm:p-8 lg:order-2">
            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-faint)]">Todo AI</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">Create your account</h2>
              <p className="mt-2 text-sm text-[var(--text-dim)]">Use a provider or sign up with email.</p>
            </div>

            {error ? <div className="error-banner mb-5 rounded-2xl border border-[rgba(255,135,124,0.24)] bg-[rgba(255,135,124,0.08)] px-4 py-3 text-sm text-[#ffd4cf]">{error}</div> : null}

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
              <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">or sign up with email</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">First name</label>
                  <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" className="input-shell w-full rounded-[22px] px-4 py-3 text-sm" />
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Last name</label>
                  <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" className="input-shell w-full rounded-[22px] px-4 py-3 text-sm" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Email</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-shell w-full rounded-[22px] px-4 py-3 text-sm" />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Password</label>
                <div className="input-shell flex items-center rounded-[22px] px-4 py-3">
                  <input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-faint)]" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[var(--text-faint)] transition hover:text-white">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Confirm password</label>
                <div className="input-shell flex items-center rounded-[22px] px-4 py-3">
                  <input id="confirmPassword" type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-faint)]" />
                  <button type="button" onClick={() => setShowConfirm((value) => !value)} className="text-[var(--text-faint)] transition hover:text-white">
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-press action-button-primary flex w-full items-center justify-center rounded-[22px] px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Creating account..." : "Sign up with email"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-dim)]">
              Already have an account? <Link href="/sign-in" className="text-[var(--accent-ice)] underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

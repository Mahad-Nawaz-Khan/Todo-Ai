"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

function getUrlErrorMessage(code: string | null): string | null {
  if (code === "google_auth_failed") return "Google sign-in failed. Please try again.";
  if (code === "github_auth_failed") return "GitHub sign-in failed. Please try again.";
  if (code === "email_auth_failed") return "Invalid email or password.";
  return null;
}

function sanitizeRedirectUrl(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/today";
}

function SignInFormContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlError = getUrlErrorMessage(searchParams?.get("error") ?? null);
  const redirectTarget = sanitizeRedirectUrl(searchParams?.get("redirect_url") ?? null);
  const bannerError = error || urlError;

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
    return null;
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextEmailErr = validateEmail(email);
    setEmailError(nextEmailErr);
    if (nextEmailErr) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { detail?: string };
        setError(data.detail || "Invalid email or password.");
        return;
      }

      window.location.href = redirectTarget;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.018em] text-fg">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-fg-muted">Sign in to your workspace.</p>
      </div>

      {bannerError ? <Callout tone="error">{bannerError}</Callout> : null}

      <OAuthButtons mode="sign-in" />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line-subtle" />
        <span className="text-xs text-fg-subtle">or</span>
        <div className="h-px flex-1 bg-line-subtle" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Email" error={emailError}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              inputSize="lg"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onBlur={() => setEmailError(validateEmail(email))}
              placeholder="you@example.com"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <Field label="Password">
          {({ id, invalid }) => (
            <PasswordInput
              id={id}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              invalid={invalid}
            />
          )}
        </Field>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          trailingIcon={!loading ? <ArrowRight className="size-4" aria-hidden="true" /> : undefined}
          className="w-full"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-fg-muted">
        No account?{" "}
        <Link href="/sign-up" className="font-medium text-accent-text hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="h-[420px]" />}>
      <SignInFormContent />
    </Suspense>
  );
}

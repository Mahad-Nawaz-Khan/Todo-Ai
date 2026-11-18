"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = Boolean(confirmPassword && password === confirmPassword);

  const validateEmail = (val: string) => {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return "Enter a valid email address";
    return null;
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextEmailErr = validateEmail(email);
    const nextPwErr = password.length < 8 ? "Password must be at least 8 characters" : null;
    const nextConfirmErr = password !== confirmPassword ? "Passwords do not match" : null;

    setEmailError(nextEmailErr);
    setPasswordError(nextPwErr);
    setConfirmError(nextConfirmErr);
    if (nextEmailErr || nextPwErr || nextConfirmErr) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
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
        const data = (await res.json().catch(() => ({}))) as { detail?: string };
        setError(data.detail || "Sign up failed");
        return;
      }

      window.location.href = "/today";
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
          Create your account
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Start organizing tasks in seconds.
        </p>
      </div>

      {error ? <Callout tone="error">{error}</Callout> : null}

      <OAuthButtons mode="sign-up" />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line-subtle" />
        <span className="text-xs text-fg-subtle">or</span>
        <div className="h-px flex-1 bg-line-subtle" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="First name">
            {({ id }) => (
              <Input
                id={id}
                type="text"
                inputSize="lg"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First"
              />
            )}
          </Field>
          <Field label="Last name">
            {({ id }) => (
              <Input
                id={id}
                type="text"
                inputSize="lg"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last"
              />
            )}
          </Field>
        </div>

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

        <div className="space-y-2">
          <Field label="Password" hint="At least 8 characters" error={passwordError}>
            {({ id, describedBy, invalid }) => (
              <PasswordInput
                id={id}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                onBlur={() =>
                  setPasswordError(
                    password && password.length < 8
                      ? "Password must be at least 8 characters"
                      : null
                  )
                }
                placeholder="At least 8 characters"
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>
          <PasswordStrength password={password} />
        </div>

        <Field label="Confirm password" error={confirmError}>
          {({ id, describedBy, invalid }) => (
            <PasswordInput
              id={id}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmError) setConfirmError(null);
              }}
              onBlur={() =>
                setConfirmError(
                  confirmPassword && password !== confirmPassword
                    ? "Passwords do not match"
                    : null
                )
              }
              placeholder="Repeat your password"
              aria-describedby={describedBy}
              invalid={invalid}
              trailingCheck={
                passwordsMatch ? (
                  <Check className="size-4 text-success" aria-label="Passwords match" />
                ) : null
              }
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
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-accent-text hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

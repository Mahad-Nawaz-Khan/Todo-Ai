import Link from "next/link";

const providers = [
  { id: "google", label: "Continue with Google", href: "/api/auth/google" },
  { id: "github", label: "Continue with GitHub", href: "/api/auth/github" },
] as const;

function getErrorMessage(error: string | undefined) {
  switch (error) {
    case "google_auth_failed":
      return "Google sign-in failed. Please try again.";
    case "github_auth_failed":
      return "GitHub sign-in failed. Please try again.";
    default:
      return null;
  }
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorCode } = await searchParams;
  const error = getErrorMessage(errorCode);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <div className="mb-6">
            <div className="text-sm font-semibold tracking-tight">TODO</div>
            <h1 className="mt-2 text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-white/70">Sign in with your existing account to keep your tasks and chat history.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

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
            Need an account? <Link href="/sign-up" className="text-blue-300 hover:text-blue-200">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

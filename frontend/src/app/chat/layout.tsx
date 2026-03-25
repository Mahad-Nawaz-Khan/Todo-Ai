"use client";

import Link from "next/link";

import ProfileMenu from "@/components/ProfileMenu";
import { useAuth } from "@/context/AuthContext";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-tight">TODO</div>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Chat Interface</h1>
            <p className="mt-2 text-white/70">Real-time messaging experience</p>
          </div>

          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                {user?.firstName || user?.name || user?.email || "User"}
              </div>
              <ProfileMenu />
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
            >
              Sign in to chat
            </Link>
          )}
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { useUser } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="rounded-lg bg-white p-8 shadow-md dark:bg-black">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">You need to sign in to continue.</p>
          <Link href="/sign-in" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

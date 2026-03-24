"use client";

import Link from "next/link";

import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, isLoaded, signOut } = useAuth();

  if (!isLoaded) {
    return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">You&apos;re signed out</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to view your profile.</p>
          <Link href="/sign-in" className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your account settings.</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Sign out
          </button>
        </div>

        <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="space-y-4 text-sm text-slate-700">
            <div>
              <dt className="font-medium text-slate-900">Name</dt>
              <dd className="mt-1">{user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Email</dt>
              <dd className="mt-1">{user.email || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Provider</dt>
              <dd className="mt-1 capitalize">{user.provider}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-900">Provider User ID</dt>
              <dd className="mt-1 break-all">{user.providerUserId}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

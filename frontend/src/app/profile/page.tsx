"use client";

import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your account settings.</p>
        </div>
        <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <UserProfile />
        </div>
      </div>
    </div>
  );
}
'use client';

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-tight">TODO</div>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold">
              Chat Interface
            </h1>
            <p className="mt-2 text-white/70">Real-time messaging experience</p>
          </div>
          
          <SignedIn>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-lg px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/15">
                Sign in to chat
              </button>
            </SignInButton>
          </SignedOut>
        </header>

        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
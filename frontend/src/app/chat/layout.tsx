"use client";

import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="grid min-h-screen place-items-center bg-(--bg-main) text-(--text-dim)">Loading chat workspace...</div>;
  }

  return (
    <AppShell
      title="AI chat workspace"
      subtitle="Talk to the assistant to create, update, and search tasks through the live backend mappings."
      signedIn={isSignedIn}
      userLabel={user?.firstName || user?.name || user?.email || "User"}
    >
      {children}
    </AppShell>
  );
}

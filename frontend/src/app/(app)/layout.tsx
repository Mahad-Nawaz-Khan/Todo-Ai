"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { CommandPalette } from "@/components/command/CommandPalette";
import { ShortcutsDialog } from "@/components/command/ShortcutsDialog";
import { WorkspaceHotkeys } from "@/components/command/WorkspaceHotkeys";
import { AppShell } from "@/components/shell/AppShell";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import { TasksProvider } from "@/context/TasksContext";
import { UIProvider, useUI } from "@/context/UIContext";

function AppLayoutGate({ children }: Readonly<{ children: ReactNode }>) {
  const { isLoaded, isSignedIn } = useAuth();
  const { shortcutsOpen, setShortcutsOpen } = useUI();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const target = pathname ? `?redirect_url=${encodeURIComponent(pathname)}` : "";
      router.replace(`/sign-in${target}`);
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <Logo size={32} className="animate-logo-pulse" />
      </div>
    );
  }

  return (
    <>
      <AppShell
        assistantPanel={
          <Suspense fallback={null}>
            <AssistantPanel />
          </Suspense>
        }
      >
        <Suspense fallback={null}>{children}</Suspense>
      </AppShell>

      <WorkspaceHotkeys />

      <Suspense fallback={null}>
        <TaskDrawer />
      </Suspense>

      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>

      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}

export default function AppGroupLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <TasksProvider>
      <UIProvider>
        <AppLayoutGate>{children}</AppLayoutGate>
      </UIProvider>
    </TasksProvider>
  );
}

"use client";

import { Menu as MenuIcon, Sparkles, WifiOff } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { useUI } from "@/context/UIContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useTags } from "@/hooks/useTags";
import { cn } from "@/lib/utils";

import { UserMenu } from "./UserMenu";

const ROUTE_TITLES: Record<string, string> = {
  "/today": "Today",
  "/upcoming": "Upcoming",
  "/tasks": "All tasks",
  "/completed": "Completed",
  "/chat": "Assistant",
  "/settings": "Settings",
};

export interface TopBarProps {
  rightActions?: ReactNode;
}

export function TopBar({ rightActions }: Readonly<TopBarProps>) {
  const pathname = usePathname();
  const { setMobileNavOpen, assistantOpen, toggleAssistant } = useUI();
  const { isOnline } = useOnlineStatus();
  const { tags } = useTags();

  let pageTitle = ROUTE_TITLES[pathname ?? ""] ?? "Workspace";
  if (pathname?.startsWith("/tags/")) {
    const tagId = Number(pathname.split("/")[2]);
    const matched = tags.find((t) => t.id === tagId);
    pageTitle = matched ? `#${matched.name}` : "Tag";
  }

  return (
    <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-line-subtle bg-topbar px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon-md"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          className="lg:hidden"
        >
          <MenuIcon className="size-4" />
        </Button>
        <span className="truncate text-sm font-medium text-fg">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-2">
        {!isOnline ? (
          <Badge variant="warning" icon={<WifiOff className="size-3" />}>
            Offline
          </Badge>
        ) : null}

        {rightActions}

        {pathname !== "/chat" ? (
          <button
            type="button"
            onClick={toggleAssistant}
            aria-pressed={assistantOpen}
            aria-label="Toggle AI assistant"
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] font-medium transition-colors duration-[var(--dur-fast)]",
              assistantOpen
                ? "border-accent-border bg-accent-subtle text-accent-text"
                : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg"
            )}
          >
            <Sparkles className="size-3.5 text-accent-text" aria-hidden="true" />
            <span className="hidden sm:inline">Ask AI</span>
            <Kbd className="hidden lg:inline-flex">⌘J</Kbd>
          </button>
        ) : null}

        <div className="lg:hidden">
          <UserMenu compactTrigger />
        </div>
      </div>
    </header>
  );
}

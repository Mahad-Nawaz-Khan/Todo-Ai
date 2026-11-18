"use client";

import { CalendarDays, ListTodo, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useUI } from "@/context/UIContext";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();
  const { assistantOpen, toggleAssistant } = useUI();

  const tabs = [
    { href: "/today", label: "Today", icon: Sun },
    { href: "/upcoming", label: "Upcoming", icon: CalendarDays },
    { href: "/tasks", label: "All", icon: ListTodo },
  ];

  const aiActive = assistantOpen || pathname === "/chat";

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(56px+env(safe-area-inset-bottom))] items-stretch border-t border-line-subtle bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href && !assistantOpen;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
              active ? "text-accent-text" : "text-fg-muted"
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={toggleAssistant}
        aria-pressed={aiActive}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
          aiActive ? "text-accent-text" : "text-fg-muted"
        )}
      >
        <Sparkles className="size-5" aria-hidden="true" />
        <span>AI</span>
      </button>
    </nav>
  );
}

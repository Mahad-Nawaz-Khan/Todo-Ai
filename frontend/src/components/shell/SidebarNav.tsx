"use client";

import { CalendarDays, CircleCheck, ListTodo, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Kbd } from "@/components/ui/Kbd";
import { Tooltip } from "@/components/ui/Tooltip";
import { useTasks } from "@/context/TasksContext";
import { useUI } from "@/context/UIContext";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: Readonly<SidebarNavProps>) {
  const pathname = usePathname();
  const { counts } = useTasks();
  const { assistantOpen, toggleAssistant } = useUI();

  const viewLinks = [
    {
      href: "/today",
      label: "Today",
      icon: Sun,
      count: counts.today,
      hasAlertDot: counts.overdue > 0,
    },
    {
      href: "/upcoming",
      label: "Upcoming",
      icon: CalendarDays,
      count: counts.upcoming,
      hasAlertDot: false,
    },
    {
      href: "/tasks",
      label: "All tasks",
      icon: ListTodo,
      count: counts.allOpen,
      hasAlertDot: false,
    },
    {
      href: "/completed",
      label: "Completed",
      icon: CircleCheck,
      count: counts.completed,
      hasAlertDot: false,
    },
  ];

  const isAssistantActive = assistantOpen || pathname === "/chat";

  return (
    <div className="space-y-4">
      <div className="space-y-0.5">
        {viewLinks.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const row = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors duration-[var(--dur-fast)]",
                collapsed && "justify-center px-0",
                active
                  ? "bg-selected font-medium text-fg"
                  : "text-fg-muted hover:bg-hover hover:text-fg"
              )}
            >
              <Icon
                className={cn("size-4 shrink-0", active ? "text-accent-text" : "text-fg-subtle")}
                aria-hidden="true"
              />
              {!collapsed ? (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hasAlertDot ? (
                    <span
                      aria-label={`${counts.overdue} overdue`}
                      className="size-1.5 rounded-full bg-danger"
                    />
                  ) : null}
                  {item.count > 0 ? (
                    <span className="text-xs text-fg-subtle tabular-nums">{item.count}</span>
                  ) : null}
                </>
              ) : null}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.href} label={item.label} side="bottom">
              {row}
            </Tooltip>
          ) : (
            row
          );
        })}
      </div>

      <div>
        {!collapsed ? (
          <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-fg-subtle">
            Assistant
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            toggleAssistant();
            onNavigate?.();
          }}
          aria-pressed={isAssistantActive}
          aria-label="Ask AI"
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors duration-[var(--dur-fast)]",
            collapsed && "justify-center px-0",
            isAssistantActive
              ? "bg-accent-subtle font-medium text-accent-text"
              : "text-fg-muted hover:bg-hover hover:text-fg"
          )}
        >
          <Sparkles
            className={cn("size-4 shrink-0", isAssistantActive ? "text-accent-text" : "text-fg-subtle")}
            aria-hidden="true"
          />
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1 truncate text-left">Ask AI</span>
              <Kbd>⌘J</Kbd>
            </>
          ) : null}
        </button>
      </div>
    </div>
  );
}

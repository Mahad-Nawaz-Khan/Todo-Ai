"use client";

import { PanelLeftClose, PanelLeftOpen, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { Logo } from "@/components/ui/Logo";
import { Tooltip } from "@/components/ui/Tooltip";
import { useUI } from "@/context/UIContext";
import { cn } from "@/lib/utils";

import { SidebarNav } from "./SidebarNav";
import { SidebarTags } from "./SidebarTags";
import { UserMenu } from "./UserMenu";

const TASK_VIEW_ROUTES = ["/today", "/upcoming", "/tasks"];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar, setQuickAddOpen, setCommandPaletteOpen } = useUI();

  const handleNewTask = () => {
    setQuickAddOpen(true);
    if (!TASK_VIEW_ROUTES.includes(pathname ?? "") && !pathname?.startsWith("/tags/")) {
      router.push("/today");
    }
  };

  return (
    <aside
      aria-label="Workspace navigation"
      className={cn(
        "hidden shrink-0 flex-col border-r border-line-subtle bg-surface transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out)] lg:flex",
        sidebarCollapsed ? "w-14" : "w-[248px]"
      )}
    >
      <div
        className={cn(
          "flex h-[52px] shrink-0 items-center border-b border-line-subtle px-3",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/today"
          className={cn(
            "flex items-center gap-2 rounded-md py-1",
            sidebarCollapsed ? "justify-center" : "px-1"
          )}
        >
          <Logo size={24} />
          {!sidebarCollapsed ? (
            <span className="text-sm font-semibold tracking-[-0.01em] text-fg">Todo AI</span>
          ) : null}
        </Link>

        {!sidebarCollapsed ? (
          <Tooltip label="Collapse sidebar" shortcut="⌘\" side="bottom">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="size-4 text-fg-subtle" />
            </Button>
          </Tooltip>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-2.5 py-3">
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <Tooltip label="Expand sidebar" shortcut="⌘\" side="bottom">
              <Button
                variant="ghost"
                size="icon-md"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="size-4 text-fg-subtle" />
              </Button>
            </Tooltip>
            <Tooltip label="New task" shortcut="C" side="bottom">
              <Button
                variant="secondary"
                size="icon-md"
                onClick={handleNewTask}
                aria-label="New task"
              >
                <Plus className="size-4" />
              </Button>
            </Tooltip>
            <Tooltip label="Command palette" shortcut="⌘K" side="bottom">
              <Button
                variant="ghost"
                size="icon-md"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Search commands"
              >
                <Search className="size-4 text-fg-subtle" />
              </Button>
            </Tooltip>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Button
              variant="secondary"
              size="md"
              onClick={handleNewTask}
              className="w-full justify-between px-2.5"
            >
              <span className="flex items-center gap-2">
                <Plus className="size-4 text-fg-subtle" aria-hidden="true" />
                <span>New task</span>
              </span>
              <Kbd>C</Kbd>
            </Button>

            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex h-8 w-full items-center justify-between rounded-md border border-line bg-surface-2 px-2.5 text-sm text-fg-subtle transition-colors duration-[var(--dur-fast)] hover:border-line-strong hover:text-fg"
            >
              <span className="flex items-center gap-2">
                <Search className="size-3.5" aria-hidden="true" />
                <span>Search…</span>
              </span>
              <Kbd>⌘K</Kbd>
            </button>
          </div>
        )}

        <nav aria-label="Views">
          <SidebarNav collapsed={sidebarCollapsed} />
        </nav>

        <div className="border-t border-line-subtle pt-3">
          <SidebarTags collapsed={sidebarCollapsed} />
        </div>
      </div>

      <div className="border-t border-line-subtle p-2">
        <UserMenu collapsed={sidebarCollapsed} />
      </div>
    </aside>
  );
}

"use client";

import { Command } from "cmdk";
import { Search, LayoutDashboard, MessageSquareText, PlusSquare, LogIn } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useUser } from "@/context/AuthContext";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Chat Workspace", href: "/chat", icon: MessageSquareText },
  { label: "Advanced Chat", href: "/chat/advanced", icon: MessageSquareText },
];

export default function AppCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const close = () => setOpen(false);
    const openPalette = () => setOpen(true);
    window.addEventListener("todo:close-command-palette", close);
    window.addEventListener("todo:open-command-palette", openPalette);
    return () => {
      window.removeEventListener("todo:close-command-palette", close);
      window.removeEventListener("todo:open-command-palette", openPalette);
    };
  }, []);

  const items = useMemo(() => {
    if (!isSignedIn) {
      return [
        { label: "Go to sign in", action: () => router.push("/sign-in"), icon: LogIn },
        { label: "Open dashboard", action: () => router.push("/"), icon: LayoutDashboard },
      ];
    }

    return [
      ...navItems.map((item) => ({
        label: item.label,
        action: () => router.push(item.href),
        icon: item.icon,
      })),
      {
        label: "Create new task",
        action: () => {
          router.push("/");
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("todo:open-task-form"));
          }, 80);
        },
        icon: PlusSquare,
      },
      {
        label: "Start new chat",
        action: () => {
          if (pathname !== "/chat") {
            router.push("/chat");
          }
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("todo:start-new-chat"));
          }, 80);
        },
        icon: MessageSquareText,
      },
    ];
  }, [isSignedIn, pathname, router]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[rgba(5,8,15,0.72)] px-4 pt-[12vh] backdrop-blur-md"
      onClick={() => setOpen(false)}
    >
      <Command
        className="glass-panel w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(10,14,22,0.98)] shadow-[0_24px_90px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
          <Search className="size-4 text-(--text-dim)" />
          <Command.Input
            autoFocus
            placeholder="Jump to pages, create tasks, or control the workspace"
            className="w-full bg-transparent text-sm text-(--text-primary) outline-none placeholder:text-(--text-faint)"
          />
          <kbd className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.28em] text-(--text-faint)">
            esc
          </kbd>
        </div>
        <Command.List className="max-h-[420px] overflow-y-auto p-3">
          <Command.Empty className="px-3 py-8 text-center text-sm text-(--text-dim)">
            Nothing matched that search.
          </Command.Empty>
          <Command.Group heading="Actions" className="text-[11px] uppercase tracking-[0.28em] text-(--text-faint)">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Command.Item
                  key={item.label}
                  value={item.label}
                  onSelect={() => {
                    item.action();
                    setOpen(false);
                  }}
                  className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm text-(--text-secondary) outline-none transition data-[selected=true]:border-white/10 data-[selected=true]:bg-white/8 data-[selected=true]:text-white"
                >
                  <span className="flex size-9 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-(--accent-ice)">
                    <Icon className="size-4" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

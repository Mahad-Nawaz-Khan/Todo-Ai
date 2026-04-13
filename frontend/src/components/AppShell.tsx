"use client";

import { AnimatePresence, m } from "framer-motion";
import { Command, LayoutDashboard, Menu, MessageSquareText, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import ProfileMenu from "@/components/ProfileMenu";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  signedIn: boolean;
  userLabel?: string;
};

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquareText },
  { href: "/chat/advanced", label: "Lab", icon: Sparkles },
];

export default function AppShell({ children, title, subtitle, signedIn, userLabel }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
      <div className="aurora-grid" />
      <div className="noise-overlay" />
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-2 py-2 sm:px-4 sm:py-3 lg:px-6">
        <div className="glass-panel relative flex min-h-[calc(100vh-1rem)] flex-1 overflow-hidden rounded-[24px] border border-white/8 sm:min-h-[calc(100vh-1.5rem)] sm:rounded-[32px]">
          <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/7 bg-[rgba(255,255,255,0.03)] lg:flex">
            <div className="border-b border-white/7 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_top,#9fe7ff,transparent_65%),rgba(255,255,255,0.06)] shadow-[0_0_40px_rgba(111,219,255,0.14)]">
                  <Sparkles className="size-5 text-[var(--accent-ice)]" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-faint)]">Todo AI</p>
                  <h1 className="text-lg font-semibold tracking-[-0.03em] text-white">Command Center</h1>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-4 py-4">
              <div className="mb-3 px-3 text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">Workspace</div>
              <div className="space-y-2">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition",
                        active
                          ? "border-white/12 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          : "border-transparent bg-transparent text-[var(--text-dim)] hover:border-white/8 hover:bg-white/6 hover:text-white"
                      )}
                    >
                      <span className="flex size-9 items-center justify-center rounded-2xl border border-white/8 bg-white/6">
                        <Icon className="size-4" />
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
            <div className="border-t border-white/7 p-4">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("todo:open-command-palette"))}
                className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-left text-sm text-[var(--text-dim)] transition hover:border-white/12 hover:bg-white/9 hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <Command className="size-4" />
                  Command palette
                </span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-faint)]">Ctrl K</span>
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-white/7 px-3 py-3 sm:px-6 sm:py-4">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="flex size-10 items-center justify-center rounded-xl border border-white/8 bg-white/6 text-[var(--text-secondary)] lg:hidden sm:size-11 sm:rounded-2xl"
                    aria-label="Open navigation"
                  >
                    <Menu className="size-5" />
                  </button>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--text-faint)]">Workspace</p>
                    <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-white sm:mt-2 sm:text-3xl">{title}</h2>
                    <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[var(--text-dim)] sm:mt-2 sm:text-base sm:leading-6">{subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("todo:open-command-palette"))}
                    className="hidden rounded-2xl border border-white/8 bg-white/6 px-3 py-2 text-sm text-[var(--text-dim)] transition hover:border-white/12 hover:bg-white/9 hover:text-white sm:flex sm:items-center sm:gap-3"
                  >
                    <Command className="size-4" />
                    <span>Search actions</span>
                  </button>
                  {signedIn ? (
                    <>
                      <div className="hidden rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-right md:block">
                        <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">Active user</div>
                        <div className="mt-1 text-sm font-medium text-white">{userLabel || "User"}</div>
                      </div>
                      <ProfileMenu />
                    </>
                  ) : (
                    <Link href="/sign-in" className="action-button-secondary px-4 py-2.5 text-sm">
                      Sign in
                    </Link>
                  )}
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-x-hidden px-3 py-3 sm:px-6 sm:py-6">{children}</main>
          </div>

          <AnimatePresence>
            {mobileOpen ? (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[rgba(6,8,14,0.68)] backdrop-blur-sm lg:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <m.div
                  initial={{ x: -36, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -36, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  className="h-full w-[86%] max-w-[320px] border-r border-white/8 bg-[rgba(8,12,20,0.98)] p-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-white/8 bg-white/6">
                      <Sparkles className="size-5 text-[var(--accent-ice)]" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">Todo AI</div>
                      <div className="text-base font-semibold text-white">Mobile workspace</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {nav.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm",
                            active
                              ? "border-white/12 bg-white/10 text-white"
                              : "border-transparent bg-transparent text-[var(--text-dim)]"
                          )}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </m.div>
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

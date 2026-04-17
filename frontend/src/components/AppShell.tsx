"use client";

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

  const openDrawer = () => setMobileOpen(true);
  const closeDrawer = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="aurora-grid" />
      <div className="noise-overlay" />
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-3 md:px-6 lg:px-8">
        <div className="glass-panel animate-fade-in relative flex min-h-[calc(100vh-1.5rem)] flex-1 overflow-hidden rounded-[32px] border border-white/8 md:min-h-[calc(100vh-2rem)]">
          <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/7 bg-[rgba(255,255,255,0.03)] lg:flex">
            <div className="border-b border-white/7 px-5 py-5">
              <div className="flex items-center gap-3 animate-fade-in-up">
                <div className="icon-glow flex size-11 items-center justify-center rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_top,#9fe7ff,transparent_65%),rgba(255,255,255,0.06)] shadow-[0_0_40px_rgba(111,219,255,0.14)]">
                  <Sparkles className="size-5 text-(--accent-ice)" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-(--text-faint)">Todo AI</p>
                  <h1 className="text-lg font-semibold tracking-[-0.03em] text-white">Command Center</h1>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-4 py-4">
              <div className="mb-3 px-3 text-[11px] uppercase tracking-[0.28em] text-(--text-faint)">Workspace</div>
              <div className="space-y-2 stagger-children">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "nav-link group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm animate-fade-in-up-sm",
                        active
                          ? "border-white/12 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          : "border-transparent bg-transparent text-(--text-dim) hover:border-white/8 hover:bg-white/6 hover:text-white"
                      )}
                    >
                      <span className="icon-glow flex size-9 items-center justify-center rounded-2xl border border-white/8 bg-white/6">
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
                className="btn-press flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-left text-sm text-(--text-dim) hover:border-white/12 hover:bg-white/9 hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <Command className="size-4" />
                  Command palette
                </span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-(--text-faint)">Ctrl K</span>
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="animate-fade-in border-b border-white/7 px-4 py-4 md:px-6 lg:px-8">
              <div className="flex items-start justify-between gap-4 md:gap-6">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={openDrawer}
                    className="btn-press flex size-11 items-center justify-center rounded-2xl border border-white/8 bg-white/6 text-(--text-secondary) lg:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu className="size-5" />
                  </button>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.32em] text-(--text-faint)">Workspace</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white md:text-3xl">{title}</h2>
                    <p className="mt-2 max-w-2xl text-base leading-6 text-(--text-dim)">{subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("todo:open-command-palette"))}
                    className="btn-press hidden rounded-2xl border border-white/8 bg-white/6 px-3 py-2 text-sm text-(--text-dim) hover:border-white/12 hover:bg-white/9 hover:text-white md:flex md:items-center md:gap-3"
                  >
                    <Command className="size-4" />
                    <span>Search actions</span>
                  </button>
                  {signedIn ? (
                    <>
                      <div className="animate-fade-in-up-sm hidden rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-right md:block">
                        <div className="text-[11px] uppercase tracking-[0.28em] text-(--text-faint)">Active user</div>
                        <div className="mt-1 text-sm font-medium text-white">{userLabel || "User"}</div>
                      </div>
                      <ProfileMenu />
                    </>
                  ) : (
                    <Link href="/sign-in" className="btn-press action-button-secondary px-4 py-2.5 text-sm">
                      Sign in
                    </Link>
                  )}
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-x-auto px-4 py-4 md:px-6 md:py-6 lg:px-8">{children}</main>
          </div>

          {/* Mobile drawer */}
          <div
            className={cn(
              "absolute inset-0 z-50 transition-all duration-[350ms] lg:hidden",
              mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            )}
            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <div
              className="absolute inset-0 bg-[rgba(6,8,14,0.68)] backdrop-blur-sm"
              onClick={closeDrawer}
            />
            <div
              className={cn(
                "slide-panel absolute left-0 top-0 h-full w-[86%] max-w-[320px] border-r border-white/8 bg-[rgba(8,12,20,0.98)] p-4",
                mobileOpen ? "translate-x-0 opacity-100" : "-translate-x-9 opacity-0"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center gap-3 animate-fade-in-up">
                <div className="icon-glow flex size-11 items-center justify-center rounded-2xl border border-white/8 bg-white/6">
                  <Sparkles className="size-5 text-(--accent-ice)" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-(--text-faint)">Todo AI</div>
                  <div className="text-base font-semibold text-white">Mobile workspace</div>
                </div>
              </div>
              <div className="space-y-2 stagger-children">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeDrawer}
                      className={cn(
                        "nav-link flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm animate-fade-in-up-sm",
                        active
                          ? "border-white/12 bg-white/10 text-white"
                          : "border-transparent bg-transparent text-(--text-dim)"
                      )}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

import { MobileNavDrawer } from "./MobileNavDrawer";
import { MobileTabBar } from "./MobileTabBar";
import { Sidebar } from "./Sidebar";
import { SkipLink } from "./SkipLink";
import { TopBar } from "./TopBar";

export interface AppShellProps {
  children: ReactNode;
  assistantPanel?: ReactNode;
  topBarActions?: ReactNode;
}

export function AppShell({ children, assistantPanel, topBarActions }: Readonly<AppShellProps>) {
  return (
    <div className="flex min-h-dvh bg-canvas text-fg">
      <SkipLink />
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar rightActions={topBarActions} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 pt-5 pb-24 outline-none md:px-8 md:py-7"
        >
          {children}
        </main>
      </div>

      {assistantPanel}
      <MobileTabBar />
      <MobileNavDrawer />
    </div>
  );
}

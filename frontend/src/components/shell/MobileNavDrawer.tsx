"use client";

import { Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Sheet } from "@/components/ui/Sheet";
import { useUI } from "@/context/UIContext";
import { cn } from "@/lib/utils";

import { SidebarNav } from "./SidebarNav";
import { SidebarTags } from "./SidebarTags";
import { UserMenu } from "./UserMenu";

export function MobileNavDrawer() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useUI();
  const close = () => setMobileNavOpen(false);

  return (
    <Sheet
      open={mobileNavOpen}
      onClose={close}
      side="left"
      forceBottomOnMobile={false}
      ariaLabel="Workspace navigation"
      className="bg-surface"
    >
      <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-line-subtle px-4">
        <Link href="/today" onClick={close} className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-sm font-semibold text-fg">Todo AI</span>
        </Link>
        <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close navigation">
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        <SidebarNav onNavigate={close} />

        <div className="border-t border-line-subtle pt-3">
          <SidebarTags onNavigate={close} />
        </div>

        <div className="border-t border-line-subtle pt-3">
          <Link
            href="/settings"
            onClick={close}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors",
              pathname === "/settings"
                ? "bg-selected font-medium text-fg"
                : "text-fg-muted hover:bg-hover hover:text-fg"
            )}
          >
            <Settings className="size-4 text-fg-subtle" aria-hidden="true" />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      <div className="border-t border-line-subtle p-2">
        <UserMenu />
      </div>
    </Sheet>
  );
}

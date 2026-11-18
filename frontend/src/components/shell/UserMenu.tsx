"use client";

import { ChevronsUpDown, Keyboard, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useUI } from "@/context/UIContext";
import { cn } from "@/lib/utils";

export function UserMenu({ collapsed = false, compactTrigger = false }: Readonly<{ collapsed?: boolean; compactTrigger?: boolean }>) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setShortcutsOpen } = useUI();
  const router = useRouter();

  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "User";

  return (
    <Menu
      align={compactTrigger ? "end" : "start"}
      minWidth={220}
      trigger={({ ref, isOpen, toggle }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-label="Open account menu"
          className={cn(
            "flex items-center gap-2.5 rounded-md text-left transition-colors duration-[var(--dur-fast)] hover:bg-hover",
            compactTrigger
              ? "size-8 justify-center"
              : "h-9 w-full px-2",
            collapsed && !compactTrigger && "justify-center px-0"
          )}
        >
          <Avatar
            src={user?.imageUrl}
            name={user?.name || user?.firstName}
            email={user?.email}
            size={24}
          />
          {!collapsed && !compactTrigger ? (
            <>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg">
                {displayName}
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
            </>
          ) : null}
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="px-2 py-1.5">
            <div className="truncate text-[13px] font-medium text-fg">{displayName}</div>
            {user?.email ? (
              <div className="truncate text-xs text-fg-subtle">{user.email}</div>
            ) : null}
          </div>
          <MenuSeparator />
          <MenuItem
            icon={<Settings className="size-4" />}
            label="Settings"
            shortcut="G S"
            onSelect={() => {
              close();
              router.push("/settings");
            }}
          />
          <MenuItem
            icon={<Keyboard className="size-4" />}
            label="Keyboard shortcuts"
            shortcut="?"
            onSelect={() => {
              close();
              setShortcutsOpen(true);
            }}
          />
          <MenuSeparator />
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-fg-subtle">
            Theme
          </div>
          <MenuItem
            icon={<Monitor className="size-4" />}
            label="System"
            checked={theme === "system"}
            onSelect={() => {
              setTheme("system");
              close();
            }}
          />
          <MenuItem
            icon={<Sun className="size-4" />}
            label="Light"
            checked={theme === "light"}
            onSelect={() => {
              setTheme("light");
              close();
            }}
          />
          <MenuItem
            icon={<Moon className="size-4" />}
            label="Dark"
            checked={theme === "dark"}
            onSelect={() => {
              setTheme("dark");
              close();
            }}
          />
          <MenuSeparator />
          <MenuItem
            icon={<LogOut className="size-4" />}
            label="Sign out"
            danger
            onSelect={() => {
              close();
              void signOut();
            }}
          />
        </>
      )}
    </Menu>
  );
}

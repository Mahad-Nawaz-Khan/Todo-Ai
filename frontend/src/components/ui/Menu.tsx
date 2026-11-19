"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Kbd } from "./Kbd";
import { Popover, type PopoverProps } from "./Popover";

export interface MenuProps {
  trigger: PopoverProps["trigger"];
  align?: "start" | "end";
  minWidth?: number;
  className?: string;
  children: (props: { close: () => void }) => ReactNode;
}

function MenuList({
  minWidth,
  children,
}: Readonly<{ minWidth: number; children: ReactNode }>) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = Array.from(
        container.querySelectorAll<HTMLButtonElement>("button:not([disabled])")
      );
      if (!items.length) return;

      event.preventDefault();
      const currentIndex = items.findIndex((el) => el === document.activeElement);
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (currentIndex + delta + items.length) % items.length;
      items[nextIndex]?.focus();
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={listRef} style={{ minWidth }} className="flex flex-col gap-0.5">
      {children}
    </div>
  );
}

export function Menu({
  trigger,
  align = "end",
  minWidth = 200,
  className,
  children,
}: Readonly<MenuProps>) {
  return (
    <Popover align={align} maxWidth={Math.max(240, minWidth)} trigger={trigger} className={className}>
      {({ close }) => <MenuList minWidth={minWidth}>{children({ close })}</MenuList>}
    </Popover>
  );
}

export interface MenuItemProps {
  icon?: ReactNode;
  label: string;
  shortcut?: string;
  checked?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function MenuItem({
  icon,
  label,
  shortcut,
  checked,
  danger = false,
  disabled = false,
  onSelect,
}: Readonly<MenuItemProps>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-[13px] transition-colors duration-[var(--dur-fast)] focus-visible:outline-none",
        danger
          ? "text-danger hover:bg-danger-subtle focus:bg-danger-subtle"
          : "text-fg-muted hover:bg-hover hover:text-fg focus:bg-hover focus:text-fg",
        disabled && "opacity-50"
      )}
    >
      {icon ? (
        <span className={cn("flex shrink-0 items-center", danger ? "text-danger" : "text-fg-subtle")}>
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {checked ? <Check className="size-3.5 shrink-0 text-accent-text" aria-hidden="true" /> : null}
      {shortcut ? <Kbd className="ml-2 shrink-0">{shortcut}</Kbd> : null}
    </button>
  );
}

export function MenuSeparator() {
  return <hr className="my-1 border-0 border-t border-line-subtle" />;
}

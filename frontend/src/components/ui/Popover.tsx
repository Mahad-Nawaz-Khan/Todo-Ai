"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";

import { useAnchorPosition } from "@/hooks/useAnchorPosition";
import { cn } from "@/lib/utils";

export interface PopoverTriggerProps {
  ref: RefObject<HTMLButtonElement | null>;
  popoverTarget: string;
  isOpen: boolean;
  toggle: () => void;
}

export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
  align?: "start" | "end";
  maxWidth?: number;
  className?: string;
  trigger: (props: PopoverTriggerProps) => ReactNode;
  children: (props: { close: () => void }) => ReactNode;
}

export function Popover({
  open: controlledOpen,
  onOpenChange,
  align = "start",
  maxWidth = 320,
  className,
  trigger,
  children,
}: Readonly<PopoverProps>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const popoverId = useId();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange]
  );

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const toggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      setOpen(toggleEvent.newState === "open");
    };

    panel.addEventListener("toggle", handleToggle);
    return () => panel.removeEventListener("toggle", handleToggle);
  }, [setOpen]);

  useEffect(() => {
    const panel = panelRef.current as (HTMLDivElement & {
      showPopover?: () => void;
      hidePopover?: () => void;
    }) | null;
    if (!panel) return;

    try {
      if (isOpen && typeof panel.showPopover === "function" && !panel.matches(":popover-open")) {
        panel.showPopover();
      } else if (!isOpen && typeof panel.hidePopover === "function" && panel.matches(":popover-open")) {
        panel.hidePopover();
      }
    } catch {
      // Ignore if native Popover API is unsupported
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        anchorRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, setOpen]);

  const coords = useAnchorPosition(anchorRef, panelRef, isOpen, { align, maxWidth });

  return (
    <>
      {trigger({ ref: anchorRef, popoverTarget: popoverId, isOpen, toggle })}
      <div
        ref={panelRef}
        id={popoverId}
        popover="auto"
        style={{
          top: coords.top,
          left: coords.left,
          minWidth: coords.minWidth,
          maxWidth,
        }}
        className={cn(
          "ui-popover fixed z-50 rounded-lg p-1 text-fg",
          !isOpen && "hidden",
          className
        )}
      >
        {isOpen ? children({ close }) : null}
      </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Kbd } from "./Kbd";

export interface TooltipProps {
  label: string;
  shortcut?: string;
  children: ReactNode;
  side?: "top" | "bottom";
}

export function Tooltip({ label, shortcut, children, side = "top" }: Readonly<TooltipProps>) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const timerRef = useRef<number>(0);

  const show = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = side === "top" ? rect.top - 8 : rect.bottom + 8;
      setCoords({ top, left: rect.left + rect.width / 2 });
      setOpen(true);
    }, 400);
  }, [side]);

  const hide = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setOpen(false);
  }, []);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    el.addEventListener("mouseenter", show);
    el.addEventListener("mouseleave", hide);
    el.addEventListener("focusin", show);
    el.addEventListener("focusout", hide);
    return () => {
      el.removeEventListener("mouseenter", show);
      el.removeEventListener("mouseleave", hide);
      el.removeEventListener("focusin", show);
      el.removeEventListener("focusout", hide);
      window.clearTimeout(timerRef.current);
    };
  }, [show, hide]);

  return (
    <span ref={triggerRef} className="inline-flex items-center">
      {children}
      {open && typeof document !== "undefined"
        ? createPortal(
            <span
              role="tooltip"
              style={{
                top: coords.top,
                left: coords.left,
                transform: side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
              }}
              className="pointer-events-none fixed z-[100] inline-flex items-center gap-2 rounded-sm border border-[var(--tooltip-border)] bg-[var(--tooltip-bg)] px-2 py-1 text-xs text-[var(--tooltip-fg)] shadow-md whitespace-nowrap"
            >
              <span>{label}</span>
              {shortcut ? <Kbd className="border-white/20 bg-white/10 text-white/80 shadow-none">{shortcut}</Kbd> : null}
            </span>,
            document.body
          )
        : null}
    </span>
  );
}

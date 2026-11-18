"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

interface AnchorCoords {
  top: number;
  left: number;
  minWidth: number;
}

interface AnchorOptions {
  align?: "start" | "end";
  offset?: number;
  maxWidth?: number;
}

export function useAnchorPosition(
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  options: AnchorOptions = {}
): AnchorCoords {
  const { align = "start", offset = 6, maxWidth = 320 } = options;
  const [coords, setCoords] = useState<AnchorCoords>({ top: 0, left: 0, minWidth: 200 });

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const panelWidth = panelRef.current?.offsetWidth || Math.min(Math.max(rect.width, 200), maxWidth);
    const panelHeight = panelRef.current?.offsetHeight || 220;

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < panelHeight + offset && rect.top > panelHeight + offset;
    const top = placeAbove ? Math.max(8, rect.top - panelHeight - offset) : rect.bottom + offset;

    const rawLeft = align === "end" ? rect.right - panelWidth : rect.left;
    const maxLeft = Math.max(8, window.innerWidth - panelWidth - 8);
    const left = Math.min(Math.max(8, rawLeft), maxLeft);

    setCoords({ top, left, minWidth: Math.min(Math.max(rect.width, 180), maxWidth) });
  }, [align, anchorRef, maxWidth, offset, panelRef]);

  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen, update]);

  return coords;
}

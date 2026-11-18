"use client";

import { useEffect, useRef } from "react";

export interface HotkeyBinding {
  combo: string;
  handler: (event: KeyboardEvent) => void;
  allowInInput?: boolean;
  when?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function hasOpenModal(): boolean {
  return Boolean(document.querySelector("dialog[open]"));
}

function matchesModifier(event: KeyboardEvent, combo: string): string | null {
  const parts = combo.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const needsMod = parts.includes("mod");
  const needsShift = parts.includes("shift");
  const needsAlt = parts.includes("alt");

  const hasMod = event.metaKey || event.ctrlKey;
  if (needsMod !== hasMod) return null;
  if (needsShift !== event.shiftKey) return null;
  if (needsAlt !== event.altKey) return null;

  return event.key.toLowerCase() === key ? key : null;
}

export function useHotkeys(bindings: HotkeyBinding[]) {
  const bindingsRef = useRef(bindings);
  const chordPrefixRef = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    bindingsRef.current = bindings;
  }, [bindings]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const inInput = isEditableTarget(event.target);
      const now = Date.now();
      const keyLower = event.key.toLowerCase();

      if (chordPrefixRef.current && now - chordPrefixRef.current.at > 900) {
        chordPrefixRef.current = null;
      }

      if (!inInput && !hasOpenModal() && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (chordPrefixRef.current) {
          const chord = `${chordPrefixRef.current.key} ${keyLower}`;
          chordPrefixRef.current = null;
          const matchedChord = bindingsRef.current.find(
            (b) => (b.when ?? true) && b.combo.toLowerCase() === chord
          );
          if (matchedChord) {
            event.preventDefault();
            matchedChord.handler(event);
            return;
          }
        }

        const startsChord = bindingsRef.current.some(
          (b) => (b.when ?? true) && b.combo.toLowerCase().startsWith(`${keyLower} `)
        );
        if (startsChord) {
          chordPrefixRef.current = { key: keyLower, at: now };
          return;
        }
      }

      for (const binding of bindingsRef.current) {
        if (binding.when === false) continue;
        if (binding.combo.includes(" ")) continue;
        if (inInput && !binding.allowInInput) continue;
        if (!binding.allowInInput && hasOpenModal() && binding.combo.toLowerCase() !== "mod+k") {
          continue;
        }

        if (matchesModifier(event, binding.combo)) {
          event.preventDefault();
          binding.handler(event);
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

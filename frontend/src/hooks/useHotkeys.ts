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

function canUseChord(event: KeyboardEvent, inInput: boolean): boolean {
  return !inInput && !hasOpenModal() && !event.metaKey && !event.ctrlKey && !event.altKey;
}

function tryHandleChord(
  event: KeyboardEvent,
  bindings: HotkeyBinding[],
  chordPrefixRef: React.MutableRefObject<{ key: string; at: number } | null>,
  inInput: boolean
): boolean {
  const now = Date.now();
  const keyLower = event.key.toLowerCase();

  if (chordPrefixRef.current && now - chordPrefixRef.current.at > 900) {
    chordPrefixRef.current = null;
  }

  if (!canUseChord(event, inInput)) {
    return false;
  }

  if (chordPrefixRef.current) {
    const chord = `${chordPrefixRef.current.key} ${keyLower}`;
    chordPrefixRef.current = null;
    const matchedChord = bindings.find(
      (b) => (b.when ?? true) && b.combo.toLowerCase() === chord
    );
    if (matchedChord) {
      event.preventDefault();
      matchedChord.handler(event);
      return true;
    }
  }

  const startsChord = bindings.some(
    (b) => (b.when ?? true) && b.combo.toLowerCase().startsWith(`${keyLower} `)
  );
  if (startsChord) {
    chordPrefixRef.current = { key: keyLower, at: now };
    return true;
  }

  return false;
}

function isBindingEligible(binding: HotkeyBinding, inInput: boolean, modalOpen: boolean): boolean {
  if (binding.when === false) return false;
  if (binding.combo.includes(" ")) return false;
  if (inInput && !binding.allowInInput) return false;
  if (!binding.allowInInput && modalOpen && binding.combo.toLowerCase() !== "mod+k") {
    return false;
  }
  return true;
}

function tryHandleSingleHotkey(
  event: KeyboardEvent,
  bindings: HotkeyBinding[],
  inInput: boolean
): void {
  const modalOpen = hasOpenModal();
  for (const binding of bindings) {
    if (!isBindingEligible(binding, inInput, modalOpen)) continue;
    if (matchesModifier(event, binding.combo)) {
      event.preventDefault();
      binding.handler(event);
      return;
    }
  }
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
      if (tryHandleChord(event, bindingsRef.current, chordPrefixRef, inInput)) {
        return;
      }
      tryHandleSingleHotkey(event, bindingsRef.current, inInput);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

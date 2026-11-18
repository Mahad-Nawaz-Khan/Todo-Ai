"use client";

import { usePathname, useRouter } from "next/navigation";

import { useUI } from "@/context/UIContext";
import { useHotkeys } from "@/hooks/useHotkeys";

export function WorkspaceHotkeys() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleAssistant,
    toggleSidebar,
    setQuickAddOpen,
    setShortcutsOpen,
  } = useUI();

  useHotkeys([
    {
      combo: "mod+k",
      allowInInput: true,
      handler: () => setCommandPaletteOpen(!commandPaletteOpen),
    },
    {
      combo: "mod+j",
      allowInInput: true,
      handler: () => toggleAssistant(),
    },
    {
      combo: "mod+\\",
      allowInInput: true,
      handler: () => toggleSidebar(),
    },
    {
      combo: "c",
      handler: () => {
        setQuickAddOpen(true);
        if (pathname === "/chat" || pathname === "/settings") {
          router.push("/today");
        }
      },
    },
    {
      combo: "shift+/",
      handler: () => setShortcutsOpen(true),
    },
    {
      combo: "?",
      handler: () => setShortcutsOpen(true),
    },
    { combo: "g t", handler: () => router.push("/today") },
    { combo: "g u", handler: () => router.push("/upcoming") },
    { combo: "g a", handler: () => router.push("/tasks") },
    { combo: "g c", handler: () => router.push("/completed") },
    { combo: "g s", handler: () => router.push("/settings") },
  ]);

  return null;
}

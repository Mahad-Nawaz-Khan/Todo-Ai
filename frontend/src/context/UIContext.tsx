"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const SIDEBAR_STORAGE_KEY = "todo-sidebar-collapsed";
const ASSISTANT_STORAGE_KEY = "todo-assistant-open";
const UI_PREFS_EVENT = "todo:ui-prefs";

function readBoolStorage(key: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    // Ignore storage read errors
  }
  return fallback;
}

function writeBoolStorage(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage write errors
  }
  window.dispatchEvent(new Event(UI_PREFS_EVENT));
}

function subscribePrefs(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(UI_PREFS_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(UI_PREFS_EVENT, callback);
  };
}

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

interface UIContextValue {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (next: boolean) => void;
  toggleSidebar: () => void;
  assistantOpen: boolean;
  setAssistantOpen: (next: boolean) => void;
  toggleAssistant: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (next: boolean) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (next: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (next: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (next: boolean) => void;
  selectedTaskId: number | null;
  setSelectedTaskId: (id: number | null) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: Readonly<{ children: ReactNode }>) {
  const sidebarCollapsed = useSyncExternalStore(
    subscribePrefs,
    () => readBoolStorage(SIDEBAR_STORAGE_KEY, false),
    () => false
  );
  const assistantOpen = useSyncExternalStore(
    subscribePrefs,
    () => readBoolStorage(ASSISTANT_STORAGE_KEY, false),
    () => false
  );

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  const setSidebarCollapsed = useCallback((next: boolean) => {
    writeBoolStorage(SIDEBAR_STORAGE_KEY, next);
  }, []);

  const toggleSidebar = useCallback(() => {
    writeBoolStorage(SIDEBAR_STORAGE_KEY, !readBoolStorage(SIDEBAR_STORAGE_KEY, false));
  }, []);

  const setAssistantOpen = useCallback((next: boolean) => {
    writeBoolStorage(ASSISTANT_STORAGE_KEY, next);
  }, []);

  const toggleAssistant = useCallback(() => {
    writeBoolStorage(ASSISTANT_STORAGE_KEY, !readBoolStorage(ASSISTANT_STORAGE_KEY, false));
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState(options);
    });
  }, []);

  const resolveConfirm = useCallback((result: boolean) => {
    const resolver = confirmResolveRef.current;
    confirmResolveRef.current = null;
    setConfirmState(null);
    resolver?.(result);
  }, []);

  useEffect(() => {
    const openPalette = () => setCommandPaletteOpen(true);
    const closePalette = () => setCommandPaletteOpen(false);
    const openTaskForm = () => setQuickAddOpen(true);

    window.addEventListener("todo:open-command-palette", openPalette);
    window.addEventListener("todo:close-command-palette", closePalette);
    window.addEventListener("todo:open-task-form", openTaskForm);
    return () => {
      window.removeEventListener("todo:open-command-palette", openPalette);
      window.removeEventListener("todo:close-command-palette", closePalette);
      window.removeEventListener("todo:open-task-form", openTaskForm);
    };
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,
      assistantOpen,
      setAssistantOpen,
      toggleAssistant,
      mobileNavOpen,
      setMobileNavOpen,
      quickAddOpen,
      setQuickAddOpen,
      commandPaletteOpen,
      setCommandPaletteOpen,
      shortcutsOpen,
      setShortcutsOpen,
      selectedTaskId,
      setSelectedTaskId,
      confirm,
    }),
    [
      assistantOpen,
      commandPaletteOpen,
      confirm,
      mobileNavOpen,
      quickAddOpen,
      selectedTaskId,
      setAssistantOpen,
      setSidebarCollapsed,
      shortcutsOpen,
      sidebarCollapsed,
      toggleAssistant,
      toggleSidebar,
    ]
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        tone={confirmState?.tone}
        onCancel={() => resolveConfirm(false)}
        onConfirm={() => resolveConfirm(true)}
      />
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useUI must be used within UIProvider");
  }
  return ctx;
}

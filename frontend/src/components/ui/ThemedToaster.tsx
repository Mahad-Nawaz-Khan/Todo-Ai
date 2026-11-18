"use client";

import { Toaster } from "sonner";

import { useTheme } from "@/context/ThemeContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <Toaster
      theme={resolvedTheme}
      position={isMobile ? "bottom-center" : "bottom-right"}
      offset={isMobile ? { bottom: 72 } : { bottom: 20, right: 20 }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full max-w-[360px] items-center gap-3 rounded-lg border border-line bg-overlay px-3.5 py-2.5 text-[13px] text-fg shadow-md",
          title: "font-medium text-fg",
          description: "text-xs text-fg-muted",
          actionButton:
            "ml-auto shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-accent-text hover:bg-accent-subtle transition-colors",
          cancelButton:
            "shrink-0 rounded-md px-2 py-1 text-xs font-medium text-fg-muted hover:bg-hover",
          success: "[&>[data-icon]]:text-success",
          error: "[&>[data-icon]]:text-danger",
          warning: "[&>[data-icon]]:text-warning",
          info: "[&>[data-icon]]:text-accent-text",
        },
      }}
    />
  );
}

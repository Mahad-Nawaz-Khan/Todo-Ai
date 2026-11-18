import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Kbd({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-line bg-surface-2 px-1 font-mono text-[11px] font-medium text-fg-subtle shadow-[inset_0_-1px_0_var(--border-default)]",
        className
      )}
    >
      {children}
    </kbd>
  );
}

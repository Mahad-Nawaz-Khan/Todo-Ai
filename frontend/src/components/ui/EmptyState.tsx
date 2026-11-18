import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, actions, className }: Readonly<EmptyStateProps>) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-4 py-16 text-center", className)}>
      <div className="flex size-10 items-center justify-center rounded-lg border border-line-subtle bg-surface-2 text-fg-subtle">
        {icon}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-[-0.006em] text-fg">{title}</h3>
      <p className="mt-1.5 max-w-[320px] text-sm leading-5 text-fg-muted">{description}</p>
      {actions ? <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div> : null}
    </div>
  );
}

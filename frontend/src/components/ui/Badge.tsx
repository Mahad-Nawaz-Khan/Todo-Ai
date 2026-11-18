import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-hover text-fg-muted border-transparent",
  accent: "bg-accent-subtle text-accent-text border-accent-border",
  success: "bg-success-subtle text-success border-success-border",
  warning: "bg-warning-subtle text-warning border-warning-border",
  danger: "bg-danger-subtle text-danger border-danger-border",
};

export interface BadgeProps {
  variant?: BadgeVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", icon, children, className }: Readonly<BadgeProps>) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 text-xs font-medium whitespace-nowrap tabular-nums",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}

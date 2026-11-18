import { LoaderCircle } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon-sm" | "icon-md" | "icon-lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg border border-accent-border btn-primary-highlight hover:bg-accent-hover disabled:hover:bg-accent",
  secondary:
    "bg-surface text-fg border border-line shadow-xs hover:bg-hover hover:border-line-strong disabled:hover:bg-surface",
  ghost: "bg-transparent text-fg-muted border border-transparent hover:bg-hover hover:text-fg",
  danger: "bg-danger-solid text-danger-fg border border-transparent shadow-xs hover:brightness-110",
  "danger-ghost": "bg-transparent text-danger border border-transparent hover:bg-danger-subtle",
  link: "bg-transparent border-0 text-accent-text underline-offset-4 hover:underline px-0 h-auto",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 gap-1.5 text-[13px] rounded-md",
  md: "h-8 px-3 gap-2 text-sm rounded-md",
  lg: "h-10 px-4 gap-2 text-sm rounded-md",
  "icon-sm": "size-7 p-0 justify-center rounded-md",
  "icon-md": "size-8 p-0 justify-center rounded-md",
  "icon-lg": "size-10 p-0 justify-center rounded-md",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref
) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium transition-[background-color,border-color,color,transform,filter] duration-[var(--dur-fast)] ease-[var(--ease-standard)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className
      )}
      {...rest}
    >
      {loading ? (
        <LoaderCircle className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        leadingIcon
      )}
      {children}
      {trailingIcon}
    </button>
  );
});

"use client";

import { forwardRef, useImperativeHandle, useRef, type TextareaHTMLAttributes } from "react";

import { useAutoGrow } from "@/hooks/useAutoGrow";
import { cn } from "@/lib/utils";

export type TextareaVariant = "default" | "plain";

const VARIANT_CLASSES: Record<TextareaVariant, string> = {
  default:
    "field-control rounded-md border border-line bg-surface dark:bg-surface-2 px-3 py-2 text-sm leading-5 hover:border-line-strong",
  plain:
    "border-0 bg-transparent px-0 py-0 text-sm leading-5 shadow-none outline-none focus:outline-none focus-visible:outline-none dark:bg-transparent",
};

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean;
  maxHeight?: number;
  invalid?: boolean;
  variant?: TextareaVariant;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    autoGrow = true,
    maxHeight = 240,
    invalid,
    variant = "default",
    className,
    value = "",
    rows = 2,
    ...rest
  },
  forwardedRef
) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  useImperativeHandle(forwardedRef, () => internalRef.current as HTMLTextAreaElement);
  useAutoGrow(internalRef, autoGrow ? String(value) : "", maxHeight);

  return (
    <textarea
      ref={internalRef}
      rows={rows}
      value={value}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full min-w-0 resize-none text-fg placeholder:text-fg-subtle transition-[border-color,box-shadow] duration-[var(--dur-fast)] disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        invalid && "border-danger",
        className
      )}
      {...rest}
    />
  );
});

"use client";

import { forwardRef, useImperativeHandle, useRef, type TextareaHTMLAttributes } from "react";

import { useAutoGrow } from "@/hooks/useAutoGrow";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean;
  maxHeight?: number;
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { autoGrow = true, maxHeight = 240, invalid, className, value = "", rows = 2, ...rest },
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
        "field-control w-full min-w-0 resize-none rounded-md border border-line bg-surface dark:bg-surface-2 px-3 py-2 text-sm leading-5 text-fg placeholder:text-fg-subtle transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-danger",
        className
      )}
      {...rest}
    />
  );
});

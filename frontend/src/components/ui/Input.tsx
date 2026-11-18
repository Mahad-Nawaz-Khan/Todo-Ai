import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type InputSize = "md" | "lg";

const SIZE_CLASSES: Record<InputSize, string> = {
  md: "h-8 text-sm",
  lg: "h-10 text-sm",
};

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: InputSize;
  leadingIcon?: ReactNode;
  trailingSlot?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = "md", leadingIcon, trailingSlot, invalid, className, ...rest },
  ref
) {
  if (leadingIcon || trailingSlot) {
    return (
      <div
        data-invalid={invalid ? "true" : undefined}
        className={cn(
          "field-shell flex w-full min-w-0 items-center gap-2 rounded-md border border-line bg-surface dark:bg-surface-2 px-3 text-fg transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-line-strong",
          invalid && "border-danger",
          SIZE_CLASSES[inputSize],
          className
        )}
      >
        {leadingIcon ? (
          <span className="flex shrink-0 items-center text-fg-subtle">{leadingIcon}</span>
        ) : null}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-subtle disabled:text-fg-disabled"
          {...rest}
        />
        {trailingSlot ? <span className="flex shrink-0 items-center">{trailingSlot}</span> : null}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "field-control w-full min-w-0 rounded-md border border-line bg-surface dark:bg-surface-2 px-3 text-fg placeholder:text-fg-subtle transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-danger",
        SIZE_CLASSES[inputSize],
        className
      )}
      {...rest}
    />
  );
});

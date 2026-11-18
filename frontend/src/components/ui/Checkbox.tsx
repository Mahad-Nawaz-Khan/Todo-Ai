import { Check } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, checked, ...rest },
  ref
) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 select-none", className)}>
      <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden="true"
          className={cn(
            "flex size-4 items-center justify-center rounded-xs border transition-colors duration-[var(--dur-fast)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]",
            checked
              ? "border-accent bg-accent text-accent-fg"
              : "border-line-strong bg-surface dark:bg-surface-2 hover:border-fg-subtle"
          )}
        >
          {checked ? <Check className="size-3 stroke-[2.5]" /> : null}
        </span>
      </span>
      {label ? <span className="text-sm text-fg">{label}</span> : null}
    </label>
  );
});

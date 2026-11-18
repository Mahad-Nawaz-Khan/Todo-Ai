import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, className, checked, ...rest },
  ref
) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 select-none", className)}>
      <span className="relative inline-flex h-[18px] w-8 shrink-0 items-center">
        <input ref={ref} type="checkbox" checked={checked} className="peer sr-only" {...rest} />
        <span
          aria-hidden="true"
          className={cn(
            "h-[18px] w-8 rounded-full border transition-colors duration-[var(--dur-base)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]",
            checked ? "border-accent bg-accent" : "border-line-strong bg-surface-2"
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-0.5 size-3.5 rounded-full bg-white shadow-xs transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)]",
            checked ? "translate-x-3.5" : "translate-x-0"
          )}
        />
      </span>
      {label ? <span className="text-sm text-fg">{label}</span> : null}
    </label>
  );
});

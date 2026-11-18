import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type SelectSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<SelectSize, string> = {
  sm: "h-7 text-[13px] px-2.5",
  md: "h-8 text-sm px-3",
  lg: "h-10 text-sm px-3",
};

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options?: SelectOption[];
  selectSize?: SelectSize;
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, selectSize = "md", invalid, className, children, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "field-control select-native w-full min-w-0 rounded-md border border-line bg-surface dark:bg-surface-2 text-fg transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-danger",
        SIZE_CLASSES[selectSize],
        className
      )}
      {...rest}
    >
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
});

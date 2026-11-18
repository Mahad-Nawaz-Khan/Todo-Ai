import { cn } from "@/lib/utils";

export interface ProgressProps {
  value: number;
  max: number;
  label?: string;
  className?: string;
}

export function Progress({ value, max, label, className }: Readonly<ProgressProps>) {
  const safeMax = max > 0 ? max : 1;
  const safeValue = Math.min(Math.max(0, value), safeMax);
  const complete = max > 0 && safeValue >= safeMax;

  return (
    <progress
      value={safeValue}
      max={safeMax}
      aria-label={label}
      data-complete={complete ? "true" : undefined}
      className={cn("ui-progress w-full", className)}
    />
  );
}

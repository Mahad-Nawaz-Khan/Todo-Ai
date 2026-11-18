import { AlertCircle } from "lucide-react";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  trailingLabel?: ReactNode;
  className?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  trailingLabel,
  className,
  children,
}: Readonly<FieldProps>) {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  const messageId = `${controlId}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={controlId} className="text-[13px] font-medium text-fg-muted">
          {label}
        </label>
        {trailingLabel}
      </div>
      {children({
        id: controlId,
        describedBy: hasMessage ? messageId : undefined,
        invalid: Boolean(error),
      })}
      {error ? (
        <p id={messageId} className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
      {!error && hint ? (
        <p id={messageId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

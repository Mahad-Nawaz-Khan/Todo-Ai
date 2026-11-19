import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CalloutTone = "info" | "success" | "warning" | "error";

const TONE_CLASSES: Record<CalloutTone, string> = {
  info: "border-accent-border bg-accent-subtle text-fg",
  success: "border-success-border bg-success-subtle text-fg",
  warning: "border-warning-border bg-warning-subtle text-fg",
  error: "border-danger-border bg-danger-subtle text-fg",
};

const ICON_CLASSES: Record<CalloutTone, string> = {
  info: "text-accent-text",
  success: "text-success",
  warning: "text-warning",
  error: "text-danger",
};

const TONE_ICONS: Record<CalloutTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface CalloutProps {
  tone?: CalloutTone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Callout({ tone = "info", title, children, action, className }: Readonly<CalloutProps>) {
  const Icon = TONE_ICONS[tone];
  const containerClassName = cn(
    "flex items-start gap-3 rounded-lg border p-3 text-sm",
    TONE_CLASSES[tone],
    className
  );
  const body = (
    <>
      <Icon className={cn("mt-0.5 size-4 shrink-0", ICON_CLASSES[tone])} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <div className="font-medium text-fg">{title}</div> : null}
        <div className="text-[13px] leading-5 text-fg-muted">{children}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </>
  );

  if (tone === "error") {
    return (
      <div role="alert" className={containerClassName}>
        {body}
      </div>
    );
  }

  return <output className={containerClassName}>{body}</output>;
}

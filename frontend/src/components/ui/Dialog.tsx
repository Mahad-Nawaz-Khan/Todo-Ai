"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "./Button";

export type DialogWidth = 400 | 520 | 640;

const WIDTH_CLASSES: Record<DialogWidth, string> = {
  400: "max-w-[400px]",
  520: "max-w-[520px]",
  640: "max-w-[640px]",
};

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  width?: DialogWidth;
  hideHeader?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  width = 520,
  hideHeader = false,
  footer,
  children,
  className,
}: Readonly<DialogProps>) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal?.();
    } else if (!open && dialog.open) {
      dialog.close?.();
    }
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title && !hideHeader ? titleId : undefined}
      aria-describedby={description && !hideHeader ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      className={cn(
        "ui-dialog m-auto w-[calc(100%-2rem)] overflow-hidden rounded-xl",
        WIDTH_CLASSES[width],
        className
      )}
    >
      {!hideHeader && title ? (
        <div className="flex items-start justify-between gap-4 p-5 pb-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[17px] font-semibold tracking-[-0.012em] text-fg">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-sm leading-5 text-fg-muted">
                {description}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close dialog">
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className={cn(!hideHeader && title ? "px-5" : undefined)}>{children}</div>

      {footer ? (
        <div className="flex items-center justify-end gap-2 border-t border-line-subtle p-5 pt-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}

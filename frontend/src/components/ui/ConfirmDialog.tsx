"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "./Button";
import { Dialog } from "./Dialog";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDialogProps>) {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => cancelBtnRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      width={400}
      hideHeader
      footer={
        <>
          <Button ref={cancelBtnRef} variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5 p-5">
        {tone === "danger" ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-subtle text-danger">
            <Trash2 className="size-4" aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.012em] text-fg">{title}</h2>
          <p className="mt-1.5 text-sm leading-5 text-fg-muted">{description}</p>
        </div>
      </div>
    </Dialog>
  );
}

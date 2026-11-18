"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

export type SheetSide = "right" | "left";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  side?: SheetSide;
  forceBottomOnMobile?: boolean;
  widthClass?: string;
  children: ReactNode;
  className?: string;
}

export function Sheet({
  open,
  onClose,
  ariaLabel,
  side = "right",
  forceBottomOnMobile = true,
  widthClass = "md:w-[480px]",
  children,
  className,
}: Readonly<SheetProps>) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const useBottomSheet = forceBottomOnMobile && isMobile;

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

  let positionClasses = "ui-sheet-right inset-y-2 right-2 left-auto h-[calc(100dvh-16px)] w-[calc(100%-16px)] rounded-xl";
  if (useBottomSheet) {
    positionClasses =
      "ui-sheet-bottom inset-x-0 bottom-0 top-auto h-[92dvh] max-h-[92dvh] w-full max-w-none rounded-t-xl rounded-b-none";
  } else if (side === "left") {
    positionClasses =
      "ui-sheet-right inset-y-0 left-0 right-auto h-dvh max-h-dvh w-[84%] max-w-[300px] rounded-none border-r border-line";
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={ariaLabel}
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
        "ui-sheet fixed m-0 flex max-w-none flex-col overflow-hidden",
        positionClasses,
        !useBottomSheet && side === "right" && widthClass,
        className
      )}
    >
      {useBottomSheet ? (
        <div className="flex justify-center pt-2 pb-1">
          <span aria-hidden="true" className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
      ) : null}
      {children}
    </dialog>
  );
}

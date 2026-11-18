import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function Spinner({ className }: Readonly<{ className?: string }>) {
  return (
    <LoaderCircle
      className={cn("size-4 shrink-0 animate-spin text-accent-text", className)}
      aria-hidden="true"
    />
  );
}

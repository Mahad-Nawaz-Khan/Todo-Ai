import { Flag } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Priority } from "@/types/task";

const PRIORITY_CLASSES: Record<Priority, string> = {
  HIGH: "text-danger fill-current",
  MEDIUM: "text-warning fill-current",
  LOW: "text-fg-subtle",
};

export function PriorityIcon({
  priority,
  className,
}: Readonly<{ priority: Priority; className?: string }>) {
  return (
    <Flag
      className={cn("size-3.5 shrink-0", PRIORITY_CLASSES[priority], className)}
      aria-hidden="true"
    />
  );
}

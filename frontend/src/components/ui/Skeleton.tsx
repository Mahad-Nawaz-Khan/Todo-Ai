import { cn } from "@/lib/utils";

export function Skeleton({ className }: Readonly<{ className?: string }>) {
  return <div aria-hidden="true" className={cn("animate-shimmer rounded-md", className)} />;
}

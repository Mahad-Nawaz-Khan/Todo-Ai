import { Skeleton } from "@/components/ui/Skeleton";

const TITLE_WIDTHS = ["w-2/5", "w-3/5", "w-1/2", "w-2/3", "w-2/5", "w-1/2"];

export function TaskRowSkeleton({ count = 6 }: Readonly<{ count?: number }>) {
  return (
    <div className="divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex h-10 items-center gap-3 px-3">
          <Skeleton className="size-[18px] shrink-0 rounded-full" />
          <Skeleton className={`h-3.5 ${TITLE_WIDTHS[idx % TITLE_WIDTHS.length]}`} />
          <Skeleton className="ml-auto h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

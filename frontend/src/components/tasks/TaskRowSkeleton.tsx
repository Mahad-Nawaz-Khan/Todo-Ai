import { Skeleton } from "@/components/ui/Skeleton";

const TITLE_WIDTHS = ["w-2/5", "w-3/5", "w-1/2", "w-2/3", "w-2/5", "w-1/2"];

export function TaskRowSkeleton({ count = 6 }: Readonly<{ count?: number }>) {
  const rows = Array.from({ length: count }, (_, slot) => ({
    id: `skeleton-row-${slot + 1}`,
    widthClass: TITLE_WIDTHS[slot % TITLE_WIDTHS.length],
  }));

  return (
    <div className="divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface">
      {rows.map((row) => (
        <div key={row.id} className="flex h-10 items-center gap-3 px-3">
          <Skeleton className="size-[18px] shrink-0 rounded-full" />
          <Skeleton className={`h-3.5 ${row.widthClass}`} />
          <Skeleton className="ml-auto h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

import { Progress } from "@/components/ui/Progress";

export function TodayProgress({
  completed,
  total,
}: Readonly<{ completed: number; total: number }>) {
  return (
    <div className="flex items-center gap-3">
      <output className="text-xs font-medium text-fg-subtle tabular-nums whitespace-nowrap">
        {completed} of {total} done
      </output>
      <Progress
        value={completed}
        max={Math.max(1, total)}
        label={`${completed} of ${total} tasks completed today`}
        className="w-24 sm:w-28"
      />
    </div>
  );
}

import type { ReactNode } from "react";

import { TodayProgress } from "./TodayProgress";

export interface TaskViewHeaderProps {
  title: string;
  titlePrefix?: ReactNode;
  subtitle: string;
  progress?: { completed: number; total: number } | null;
  rightSlot?: ReactNode;
}

export function TaskViewHeader({
  title,
  titlePrefix,
  subtitle,
  progress,
  rightSlot,
}: Readonly<TaskViewHeaderProps>) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {titlePrefix}
          <h1 className="truncate text-[22px] leading-7 font-semibold tracking-[-0.018em] text-fg">
            {title}
          </h1>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="text-sm text-fg-muted">{subtitle}</p>
          {progress && progress.total > 0 ? (
            <TodayProgress completed={progress.completed} total={progress.total} />
          ) : null}
        </div>
      </div>

      {rightSlot ? <div className="flex shrink-0 items-center gap-2">{rightSlot}</div> : null}
    </div>
  );
}

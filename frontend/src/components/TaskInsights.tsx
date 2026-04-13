import { memo } from "react";

import type { Task } from "@/types/task";

function isOverdue(task: Task) {
  return Boolean(task.due_date && !task.completed && new Date(task.due_date).getTime() < Date.now());
}

export default memo(function TaskInsights({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const overdue = tasks.filter(isOverdue).length;
  const highPriority = tasks.filter((task) => !task.completed && task.priority === "HIGH").length;

  const cards = [
    { label: "Total tasks", value: total, detail: "All captured work" },
    { label: "Completed", value: completed, detail: "Closed successfully" },
    { label: "Overdue", value: overdue, detail: "Need attention now" },
    { label: "High priority", value: highPriority, detail: "Urgent active items" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-panel rounded-[20px] border border-white/8 p-3 sm:rounded-[26px] sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-faint)] sm:text-[11px] sm:tracking-[0.28em]">{card.label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white sm:mt-3 sm:text-3xl">{card.value}</div>
          <div className="mt-1 text-xs text-[var(--text-dim)] sm:mt-2 sm:text-sm">{card.detail}</div>
        </div>
      ))}
    </div>
  );
});

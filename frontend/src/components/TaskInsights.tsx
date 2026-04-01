import type { Task } from "@/types/task";

function isOverdue(task: Task) {
  return Boolean(task.due_date && !task.completed && new Date(task.due_date).getTime() < Date.now());
}

export default function TaskInsights({ tasks }: { tasks: Task[] }) {
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="glass-panel rounded-[26px] border border-white/8 p-4 sm:p-5">
          <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-faint)]">{card.label}</div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{card.value}</div>
          <div className="mt-2 text-sm text-[var(--text-dim)]">{card.detail}</div>
        </div>
      ))}
    </div>
  );
}

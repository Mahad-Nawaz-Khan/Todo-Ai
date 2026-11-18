import { CalendarDays, Check, CheckCircle2, CircleCheck, Flag, ListTodo, Plus, Sparkles, Sun } from "lucide-react";

import { Kbd } from "@/components/ui/Kbd";
import { Logo } from "@/components/ui/Logo";

const PREVIEW_ROWS = [
  { title: "Review PR #42", tag: "work", tagClass: "bg-blue-600", due: "Today", dueAccent: true, done: false, high: false },
  { title: "Submit AI assignment", tag: "uni", tagClass: "bg-violet-500", due: "Today", dueAccent: true, done: false, high: true },
  { title: "Gym session", tag: "health", tagClass: "bg-green-500", due: "Done", dueAccent: false, done: true, high: false },
  { title: "Call dentist", tag: "health", tagClass: "bg-green-500", due: "Tomorrow", dueAccent: false, done: false, high: false },
];

export function ProductPreview() {
  return (
    <section aria-label="Workspace preview" className="relative mx-auto max-w-[1040px] px-4 pb-20">
      <div aria-hidden="true" className="brand-glow pointer-events-none absolute -inset-x-6 -top-10 h-72" />

      <div className="relative overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
        <div className="grid min-h-[420px] lg:grid-cols-[210px_minmax(0,1fr)_280px]">
          <div className="hidden flex-col border-r border-line-subtle bg-surface p-3 lg:flex">
            <div className="flex items-center gap-2 px-1 pb-3">
              <Logo size={20} />
              <span className="text-[13px] font-semibold text-fg">Todo AI</span>
            </div>
            <div className="space-y-1">
              <div className="flex h-7 items-center justify-between rounded-md border border-line bg-surface-2 px-2 text-xs text-fg-muted">
                <span className="flex items-center gap-1.5">
                  <Plus className="size-3.5" aria-hidden="true" /> New task
                </span>
                <Kbd>C</Kbd>
              </div>
              <div className="mt-2 flex h-7 items-center justify-between rounded-md bg-selected px-2 text-xs font-medium text-fg">
                <span className="flex items-center gap-1.5">
                  <Sun className="size-3.5 text-accent-text" aria-hidden="true" /> Today
                </span>
                <span className="text-fg-subtle tabular-nums">5</span>
              </div>
              <div className="flex h-7 items-center justify-between px-2 text-xs text-fg-muted">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-fg-subtle" aria-hidden="true" /> Upcoming
                </span>
                <span className="text-fg-subtle tabular-nums">12</span>
              </div>
              <div className="flex h-7 items-center justify-between px-2 text-xs text-fg-muted">
                <span className="flex items-center gap-1.5">
                  <ListTodo className="size-3.5 text-fg-subtle" aria-hidden="true" /> All tasks
                </span>
                <span className="text-fg-subtle tabular-nums">24</span>
              </div>
              <div className="flex h-7 items-center gap-1.5 px-2 text-xs text-fg-muted">
                <CircleCheck className="size-3.5 text-fg-subtle" aria-hidden="true" /> Completed
              </div>
            </div>
          </div>

          <div className="bg-canvas p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-lg font-semibold tracking-[-0.015em] text-fg">Today</div>
                <div className="mt-0.5 text-xs text-fg-muted">Wednesday · 3 of 8 done</div>
              </div>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-hover">
                <div className="h-full w-2/5 rounded-full bg-accent" />
              </div>
            </div>

            <div className="mt-4 divide-y divide-line-subtle overflow-hidden rounded-lg border border-line-subtle bg-surface">
              {PREVIEW_ROWS.map((row) => (
                <div key={row.title} className="flex h-10 items-center gap-2.5 px-3 text-[13px]">
                  {row.done ? (
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg">
                      <Check className="size-2.5 stroke-[2.5]" aria-hidden="true" />
                    </span>
                  ) : (
                    <span
                      className={`size-4 shrink-0 rounded-full border-[1.5px] ${
                        row.high
                          ? "border-[var(--danger)] bg-danger-subtle"
                          : "border-line-strong"
                      }`}
                    />
                  )}
                  <span
                    className={`min-w-0 flex-1 truncate font-medium ${
                      row.done ? "text-fg-subtle line-through" : "text-fg"
                    }`}
                  >
                    {row.title}
                  </span>
                  <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-hover px-2 text-[11px] text-fg-muted">
                    <span className={`size-1.5 rounded-full ${row.tagClass}`} />
                    {row.tag}
                  </span>
                  {row.high ? (
                    <Flag className="size-3 text-danger fill-current" aria-hidden="true" />
                  ) : null}
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      row.dueAccent ? "text-accent-text" : "text-fg-subtle"
                    }`}
                  >
                    {row.due}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden flex-col justify-between border-l border-line-subtle bg-surface p-3.5 md:flex">
            <div>
              <div className="flex items-center gap-2 border-b border-line-subtle pb-2.5">
                <span className="flex size-5 items-center justify-center rounded-sm bg-accent-subtle text-accent-text">
                  <Sparkles className="size-3" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-fg">Assistant</span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                <div className="ml-auto max-w-[85%] rounded-lg rounded-br-xs border border-line-subtle bg-surface-2 px-2.5 py-1.5 text-fg">
                  Move the AI assignment to today, high priority.
                </div>
                <div className="space-y-2 text-fg-muted">
                  <p>Updated your assignment to today with High priority.</p>
                  <div className="flex items-center gap-2 rounded-md border border-line bg-surface-2 p-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-success-subtle text-success">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-fg">Task updated</div>
                      <div className="truncate text-[11px] text-fg-subtle">
                        Submit AI assignment · Today
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex h-8 items-center justify-between rounded-md border border-line bg-surface-2 px-2.5 text-xs text-fg-subtle">
              <span>Ask anything…</span>
              <span className="flex size-5 items-center justify-center rounded-sm bg-accent text-accent-fg">
                ↑
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

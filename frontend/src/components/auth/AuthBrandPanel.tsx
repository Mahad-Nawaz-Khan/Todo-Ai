import { Check, CheckCircle2, Flag, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Kbd } from "@/components/ui/Kbd";

export function AuthBrandPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden flex-col items-center justify-center overflow-hidden border-l border-line-subtle bg-surface p-10 lg:flex"
    >
      <div className="brand-glow pointer-events-none absolute inset-0" />

      <div className="relative w-full max-w-[380px] space-y-3">
        <div className="rounded-xl border border-line bg-surface p-4 shadow-md">
          <div className="flex items-center justify-between border-b border-line-subtle pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-fg">Today</span>
              <Badge variant="accent">3 tasks</Badge>
            </div>
            <Kbd>⌘K</Kbd>
          </div>

          <ul className="mt-2.5 space-y-2 text-[13px]">
            <li className="flex items-center gap-2.5">
              <span className="size-4 shrink-0 rounded-full border-[1.5px] border-line-strong" />
              <span className="flex-1 truncate font-medium text-fg">Review PR #42</span>
              <span className="text-xs font-medium text-accent-text">Today</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg">
                <Check className="size-2.5 stroke-[2.5]" />
              </span>
              <span className="flex-1 truncate text-fg-subtle line-through">Gym session</span>
              <span className="text-xs text-fg-subtle">Done</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-4 shrink-0 rounded-full border-[1.5px] border-[var(--warning)] bg-warning-subtle" />
              <span className="flex-1 truncate font-medium text-fg">Call dentist</span>
              <Flag className="size-3 text-warning fill-current" />
              <span className="text-xs font-medium text-fg-muted">Fri</span>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-md">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-success-subtle text-success">
            <CheckCircle2 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-fg">Task created</span>
              <Badge variant="accent" icon={<Sparkles className="size-2.5" />}>
                Assistant
              </Badge>
            </div>
            <div className="truncate text-xs text-fg-muted">
              &ldquo;Call dentist&rdquo; · Fri · Medium priority
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-8 text-center">
        <p className="text-[17px] font-semibold tracking-[-0.012em] text-fg">
          Talk to your todo list.
        </p>
        <p className="mt-1 text-sm text-fg-muted">
          Fast keyboard workflows meet natural-language AI.
        </p>
      </div>
    </aside>
  );
}

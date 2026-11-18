import { CheckCircle2, Sparkles } from "lucide-react";

export function AiDemo() {
  return (
    <section className="mx-auto max-w-[1040px] px-4 py-12">
      <div className="grid items-center gap-8 rounded-xl border border-line bg-surface p-6 md:grid-cols-2 md:p-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-text">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>Integrated Assistant</span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.018em] text-fg">
            Type a sentence, not a form.
          </h2>
          <p className="mt-2 text-sm leading-6 text-fg-muted">
            Dock the Assistant beside your task list or switch to the full chat view. Every tool
            call updates your live workspace immediately.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-line-subtle bg-canvas p-4">
          <div className="ml-auto max-w-[85%] rounded-xl rounded-br-xs border border-line-subtle bg-surface-2 px-3 py-2 text-[13px] text-fg">
            Remind me to submit the AI assignment Friday, high priority
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-success-subtle text-success">
              <CheckCircle2 className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-fg">Task created</div>
              <div className="truncate text-xs text-fg-muted">
                Submit AI assignment · Fri · High
              </div>
            </div>
            <span className="text-xs font-medium text-accent-text">View</span>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Calendar, Flame, ListChecks, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  { label: "Plan my day", icon: Calendar },
  { label: 'Add "Call dentist" on Friday', icon: ListChecks },
  { label: "What's overdue?", icon: Flame },
  { label: "Show high-priority tasks", icon: Sparkles },
];

export function AssistantEmpty({
  onSelectSuggestion,
}: Readonly<{ onSelectSuggestion: (text: string) => void }>) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-3 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg bg-accent-subtle text-accent-text">
        <Sparkles className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-[15px] font-semibold text-fg">How can I help?</h3>
      <p className="mt-1 max-w-[260px] text-[13px] leading-5 text-fg-muted">
        I can create, update, find and organize your tasks.
      </p>

      <div className="mt-5 flex w-full max-w-[320px] flex-col gap-1.5">
        {SUGGESTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectSuggestion(item.label)}
              className="flex h-9 w-full items-center gap-2.5 rounded-md border border-line bg-surface px-3 text-left text-[13px] text-fg-muted transition-colors duration-[var(--dur-fast)] hover:border-line-strong hover:bg-hover hover:text-fg"
            >
              <Icon className="size-3.5 shrink-0 text-accent-text" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

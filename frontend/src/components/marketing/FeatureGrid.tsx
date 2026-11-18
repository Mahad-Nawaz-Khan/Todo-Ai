import { CalendarDays, Command, Repeat2, ShieldCheck, Smartphone, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Talk to your todo list",
    description: "Create, reschedule, filter, and complete tasks in natural language with streaming AI.",
  },
  {
    icon: Command,
    title: "Built for the keyboard",
    description: "Command palette, single-key shortcuts, and J/K row navigation keep your hands on keys.",
  },
  {
    icon: CalendarDays,
    title: "Smart views",
    description: "Today, Upcoming, All tasks, and Completed organize your schedule without manual sorting.",
  },
  {
    icon: Repeat2,
    title: "Tags & recurrence",
    description: "Color-coded labels and daily, weekly, or monthly rules keep repeating routines effortless.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description: "Sessions, tasks, tags, and chat history stay scoped cleanly to your signed-in account.",
  },
  {
    icon: Smartphone,
    title: "Every screen size",
    description: "Crisp 40px rows on desktop and thumb-friendly sheets and bottom tabs on mobile.",
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-[1040px] px-4 py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className="rounded-lg border border-line bg-surface p-5"
            >
              <div className="flex size-9 items-center justify-center rounded-md bg-accent-subtle text-accent-text">
                <Icon className="size-4" aria-hidden="true" />
              </div>
              <h2 className="mt-3.5 text-[15px] font-semibold tracking-[-0.006em] text-fg">
                {feat.title}
              </h2>
              <p className="mt-1.5 text-sm leading-5 text-fg-muted">{feat.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

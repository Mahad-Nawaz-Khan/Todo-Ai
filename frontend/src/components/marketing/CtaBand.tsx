import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CtaBand() {
  return (
    <section className="mx-auto max-w-[1040px] px-4 pt-8 pb-20">
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-line bg-surface p-6 sm:flex-row sm:items-center md:p-8">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.015em] text-fg">
            Ready to reclaim your focus?
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            Start capturing and organizing tasks in seconds.
          </p>
        </div>
        <Link
          href="/sign-up"
          className="btn-primary-highlight inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-accent-border bg-accent px-5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          <span>Get started — it&apos;s free</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

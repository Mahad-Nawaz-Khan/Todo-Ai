import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";

export function Hero() {
  return (
    <section className="mx-auto max-w-[760px] px-4 pt-16 pb-12 text-center md:pt-24 md:pb-16">
      <div className="flex justify-center">
        <Badge variant="accent" icon={<Sparkles className="size-3" />}>
          AI-powered task manager
        </Badge>
      </div>

      <h1 className="mt-5 text-[40px] leading-[44px] font-semibold tracking-[-0.025em] text-fg lg:text-[60px] lg:leading-[64px] lg:tracking-[-0.03em]">
        Plan less. Do more.
      </h1>

      <p className="mx-auto mt-4 max-w-[540px] text-[17px] leading-[28px] text-fg-muted">
        Capture, organize and finish your tasks — by typing or just asking. Built with
        keyboard-first speed and calm precision.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/sign-up"
          className="btn-primary-highlight inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-accent-border bg-accent px-5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover sm:w-auto"
        >
          <span>Get started — it&apos;s free</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-line bg-surface px-5 text-sm font-medium text-fg shadow-xs transition-colors hover:border-line-strong hover:bg-hover sm:w-auto"
        >
          Sign in
        </Link>
      </div>
    </section>
  );
}

import Link from "next/link";

import { Logo } from "@/components/ui/Logo";

import { ThemeToggleButton } from "./ThemeToggleButton";

export function LandingNav() {
  return (
    <header className="border-b border-line-subtle bg-canvas">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={24} />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">Todo AI</span>
        </Link>

        <nav aria-label="Marketing navigation" className="flex items-center gap-2">
          <ThemeToggleButton />
          <Link
            href="/sign-in"
            className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-hover hover:text-fg"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="btn-primary-highlight inline-flex h-8 items-center rounded-md border border-accent-border bg-accent px-3 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

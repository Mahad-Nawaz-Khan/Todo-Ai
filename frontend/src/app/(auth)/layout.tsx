import Link from "next/link";
import type { ReactNode } from "react";

import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { ThemeToggleButton } from "@/components/marketing/ThemeToggleButton";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  const year = new Date().getFullYear();

  return (
    <div className="grid min-h-dvh bg-canvas text-fg lg:grid-cols-2">
      <div className="flex min-h-dvh flex-col justify-between px-6 py-6 md:px-10 md:py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Logo size={24} />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">Todo AI</span>
          </Link>
          <ThemeToggleButton />
        </div>

        <main className="mx-auto w-full max-w-[380px] py-10">{children}</main>

        <div className="text-xs text-fg-subtle">© {year} Todo AI</div>
      </div>

      <AuthBrandPanel />
    </div>
  );
}

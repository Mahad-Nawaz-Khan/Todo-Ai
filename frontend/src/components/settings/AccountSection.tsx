"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export function AccountSection() {
  const { signOut } = useAuth();

  return (
    <section className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4">
      <div>
        <h2 className="text-[15px] font-semibold text-fg">Sign out</h2>
        <p className="mt-0.5 text-[13px] text-fg-muted">
          End your current session on this browser.
        </p>
      </div>
      <Button
        variant="secondary"
        leadingIcon={<LogOut className="size-4" />}
        onClick={() => signOut().catch(() => {})}
      >
        Sign out
      </Button>
    </section>
  );
}

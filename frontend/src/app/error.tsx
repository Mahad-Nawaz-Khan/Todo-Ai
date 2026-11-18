"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 text-fg">
      <div className="w-full max-w-[460px] space-y-4">
        <EmptyState
          icon={<AlertTriangle className="size-5" />}
          title="Something went wrong"
          description="An unexpected error interrupted this screen."
          className="py-8"
          actions={
            <Button variant="primary" onClick={reset}>
              Try again
            </Button>
          }
        />
        {error?.message ? (
          <Callout tone="error">{error.message}</Callout>
        ) : null}
      </div>
    </div>
  );
}

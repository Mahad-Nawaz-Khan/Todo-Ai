import { Compass } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 text-fg">
      <EmptyState
        icon={<Compass className="size-5" />}
        title="Page not found"
        description="The page you requested doesn't exist or may have moved."
        actions={
          <Link
            href="/today"
            className="btn-primary-highlight inline-flex h-8 items-center rounded-md border border-accent-border bg-accent px-3 text-sm font-medium text-accent-fg hover:bg-accent-hover"
          >
            Go to Today
          </Link>
        }
      />
    </div>
  );
}

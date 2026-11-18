import { useId } from "react";

import { cn } from "@/lib/utils";

export function Logo({ size = 24, className }: Readonly<{ size?: number; className?: string }>) {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 rounded-sm", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--logo-from)" />
          <stop offset="100%" stopColor="var(--logo-to)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <path
        d="M8.5 16.5L13.5 21.5L23.5 10.5"
        stroke="white"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 5.5L24.75 7.25L26.5 8L24.75 8.75L24 10.5L23.25 8.75L21.5 8L23.25 7.25Z"
        fill="white"
      />
    </svg>
  );
}

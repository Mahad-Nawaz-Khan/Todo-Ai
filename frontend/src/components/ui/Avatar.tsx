"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type AvatarSize = 20 | 24 | 32 | 48 | 72;

const SIZE_CLASSES: Record<AvatarSize, string> = {
  20: "size-5 text-[10px]",
  24: "size-6 text-[11px]",
  32: "size-8 text-xs",
  48: "size-12 text-base",
  72: "size-[72px] text-2xl",
};

function AvatarImage({ src, alt, size }: Readonly<{ src: string; alt: string; size: AvatarSize }>) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.charAt(0).toUpperCase();
}

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ src, name, email, size = 32, className }: Readonly<AvatarProps>) {
  const label = name || email || "User";
  const initials = getInitials(name, email);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-accent-subtle font-semibold text-accent-text select-none",
        SIZE_CLASSES[size],
        className
      )}
    >
      <span aria-hidden={Boolean(src)}>{initials}</span>
      {src ? (
        <span className="absolute inset-0">
          <AvatarImage key={src} src={src} alt={label} size={size} />
        </span>
      ) : null}
    </span>
  );
}

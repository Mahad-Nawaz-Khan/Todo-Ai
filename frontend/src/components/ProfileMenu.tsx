"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getInitialsLabel(name: string | null | undefined, email: string | null | undefined) {
  return (name || email || "U").charAt(0).toUpperCase();
}

function getProviderLabel(provider: string | null | undefined) {
  if (!provider) return "Account";
  if (provider === "google") return "Google";
  if (provider === "github") return "GitHub";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export default function ProfileMenu() {
  const { user, signOut, getToken, refreshSession } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayName = useMemo(() => {
    if (!user) return "User";
    return user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file || !API_BASE_URL) {
        return;
      }

      setUploadError(null);
      setIsUploading(true);

      try {
        const token = await getToken();
        if (!token) {
          setUploadError("Sign in again to update your profile photo.");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile-image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.detail || "Failed to update profile photo");
        }

        await refreshSession();
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Failed to update profile photo");
      } finally {
        setIsUploading(false);
      }
    },
    [getToken, refreshSession]
  );

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-sm text-white/80"
        aria-label="Open account menu"
        aria-expanded={isOpen}
      >
        {user.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={displayName}
            width={44}
            height={44}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="font-medium">{getInitialsLabel(user.firstName || user.name, user.email)}</span>
        )}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 w-80 rounded-3xl border border-white/10 bg-slate-950/95 p-5 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-lg font-semibold text-white">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{getInitialsLabel(user.firstName || user.name, user.email)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-white">{displayName}</div>
              <div className="truncate text-sm text-white/65">{user.email || "No email available"}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-white/45">{getProviderLabel(user.provider)}</div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-sm font-medium text-white/85 transition hover:text-white disabled:cursor-not-allowed disabled:text-white/40"
            >
              {isUploading ? "Uploading photo..." : "Change profile photo"}
            </button>
            {uploadError ? <p className="mt-2 text-sm text-red-300">{uploadError}</p> : null}
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={signOut}
              className="text-sm font-medium text-red-400 transition hover:text-red-300"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

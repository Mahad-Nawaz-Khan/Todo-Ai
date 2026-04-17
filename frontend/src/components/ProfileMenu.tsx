"use client";

import { Camera, LogOut, User2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

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

function InitialsAvatar({ name, email, className }: { name: string | null | undefined; email: string | null | undefined; className?: string }) {
  const letter = getInitialsLabel(name, email);
  return <span className={className}>{letter}</span>;
}

export default function ProfileMenu() {
  const { user, signOut, getToken, refreshSession } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayName = useMemo(() => {
    if (!user) return "User";
    return user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";
  }, [user]);

  useEffect(() => setImgError(false), [user?.imageUrl]);

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    setDropdownPos({
      top: rect.bottom + scrollTop + 12,
      right: window.innerWidth - rect.right + scrollLeft,
    });

    const handleResize = () => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const st = window.scrollY || document.documentElement.scrollTop;
      const sl = window.scrollX || document.documentElement.scrollLeft;
      setDropdownPos({
        top: r.bottom + st + 12,
        right: window.innerWidth - r.right + sl,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
      setDropdownPos({
        top: rect.bottom + scrollTop + 12,
        right: window.innerWidth - rect.right + scrollLeft,
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

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

        setImgError(false);
        await refreshSession();
        toast.success("Profile photo updated");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update profile photo";
        setUploadError(message);
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [getToken, refreshSession]
  );

  if (!user) return null;

  const showImage = user.imageUrl && !imgError;

  return (
    <div className="relative z-50" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex size-12 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-white/6 text-sm text-white/80 shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
        aria-label="Open account menu"
        aria-expanded={isOpen}
      >
        {showImage ? (
          <Image src={user.imageUrl!} alt={displayName} width={48} height={48} className="h-full w-full object-cover" unoptimized onError={() => setImgError(true)} />
        ) : (
          <InitialsAvatar name={user.firstName || user.name} email={user.email} className="flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(74,167,255,0.95),rgba(144,229,255,0.7))] text-sm font-semibold text-[#04121f]" />
        )}
      </button>

      {isOpen &&
        dropdownPos &&
        createPortal(
          <div
            className="absolute z-9999 w-[320px] rounded-[28px] border border-white/10 bg-[rgba(8,12,20,0.98)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
            style={{ top: dropdownPos.top, right: dropdownPos.right }}
          >
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-3xl border border-white/8 bg-white/6 text-lg font-semibold text-white">
                {showImage ? (
                  <Image src={user.imageUrl!} alt={displayName} width={64} height={64} className="h-full w-full object-cover" unoptimized onError={() => setImgError(true)} />
                ) : (
                  <InitialsAvatar name={user.firstName || user.name} email={user.email} className="flex size-16 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,rgba(74,167,255,0.95),rgba(144,229,255,0.7))] text-lg font-semibold text-[#04121f]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-white">{displayName}</div>
                <div className="truncate text-sm text-(--text-dim)">{user.email || "No email available"}</div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-(--text-faint)">
                  <User2 className="size-3.5" /> {getProviderLabel(user.provider)}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleUpload} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="action-button-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                <Camera className="size-4" /> {isUploading ? "Uploading photo..." : "Change profile photo"}
              </button>
              {uploadError ? <p className="text-sm text-[#ffd4cf]">{uploadError}</p> : null}
            </div>

            <div className="mt-5 border-t border-white/8 pt-4">
              <button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(255,135,124,0.2)] bg-[rgba(255,135,124,0.08)] px-4 py-2.5 text-sm text-[#ffd4cf] transition hover:bg-[rgba(255,135,124,0.12)]">
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

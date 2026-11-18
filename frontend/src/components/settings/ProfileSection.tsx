"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getProviderLabel(provider?: string | null): string {
  if (!provider) return "Account";
  if (provider === "google") return "Google";
  if (provider === "github") return "GitHub";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function ProfileSection() {
  const { user, getToken, refreshSession } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "User";

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setUploading(true);
      const token = await getToken();
      if (!token) throw new Error("Sign in again to update your profile photo.");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/v1/auth/profile-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as { detail?: string } | null;
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to update profile photo");
      }

      await refreshSession();
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-lg border border-line bg-surface">
      <div className="border-b border-line-subtle px-5 py-4">
        <h2 className="text-[15px] font-semibold text-fg">Profile</h2>
        <p className="mt-0.5 text-[13px] text-fg-muted">Your account identity and photo.</p>
      </div>

      <div className="divide-y divide-line-subtle px-5">
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
          <Avatar
            src={user?.imageUrl}
            name={user?.name || user?.firstName}
            email={user?.email}
            size={72}
          />
          <div className="space-y-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              loading={uploading}
              leadingIcon={<Camera className="size-3.5" />}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Uploading…" : "Change photo"}
            </Button>
            <p className="text-xs text-fg-subtle">PNG, JPG, WEBP or GIF.</p>
          </div>
        </div>

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-fg-subtle">Name</div>
            <div className="mt-1 text-sm font-medium text-fg">{displayName}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-fg-subtle">Email</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-fg">
                {user?.email || "No email"}
              </span>
              <Badge variant="neutral">{getProviderLabel(user?.provider)}</Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

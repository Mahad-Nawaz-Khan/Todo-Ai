import { AccountSection } from "@/components/settings/AccountSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { TagsSection } from "@/components/settings/TagsSection";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <div>
        <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.018em] text-fg">
          Settings
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Manage your profile, appearance, and tags.
        </p>
      </div>

      <ProfileSection />
      <AppearanceSection />
      <TagsSection />
      <AccountSection />
    </div>
  );
}

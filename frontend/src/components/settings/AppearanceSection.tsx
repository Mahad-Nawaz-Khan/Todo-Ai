"use client";

import { useTheme, type ThemePreference } from "@/context/ThemeContext";

import { ThemeCard } from "./ThemeCard";

const OPTIONS: Array<{ mode: ThemePreference; label: string }> = [
  { mode: "light", label: "Light" },
  { mode: "dark", label: "Dark" },
  { mode: "system", label: "System" },
];

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="rounded-lg border border-line bg-surface">
      <div className="border-b border-line-subtle px-5 py-4">
        <h2 className="text-[15px] font-semibold text-fg">Appearance</h2>
        <p className="mt-0.5 text-[13px] text-fg-muted">
          Choose how Todo AI looks on this device.
        </p>
      </div>

      <fieldset className="p-5">
        <legend className="sr-only">Theme preference</legend>
        <div className="flex flex-wrap gap-3">
          {OPTIONS.map((opt) => (
            <ThemeCard
              key={opt.mode}
              mode={opt.mode}
              label={opt.label}
              selected={theme === opt.mode}
              onSelect={() => setTheme(opt.mode)}
            />
          ))}
        </div>
      </fieldset>
    </section>
  );
}

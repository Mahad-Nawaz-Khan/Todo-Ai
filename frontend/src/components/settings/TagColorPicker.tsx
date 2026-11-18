"use client";

import { Check } from "lucide-react";

import { Popover } from "@/components/ui/Popover";
import { resolveTagColor, TAG_PALETTE } from "@/lib/tagColors";
import { cn } from "@/lib/utils";

export function TagColorPicker({
  color,
  tagName,
  onSelect,
}: Readonly<{
  color?: string | null;
  tagName: string;
  onSelect: (hex: string) => void;
}>) {
  const activeHex = resolveTagColor(color).toUpperCase();

  return (
    <Popover
      align="start"
      maxWidth={190}
      trigger={({ ref, isOpen, toggle }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-label={`Change color for tag ${tagName}`}
          className="flex size-7 items-center justify-center rounded-md hover:bg-hover"
        >
          <span
            className="size-3 rounded-full ring-1 ring-black/10 dark:ring-white/15"
            style={{ backgroundColor: activeHex }}
          />
        </button>
      )}
    >
      {({ close }) => (
        <fieldset className="p-2">
          <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-fg-subtle">
            Tag color
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {TAG_PALETTE.map((swatch) => {
              const selected = swatch.hex.toUpperCase() === activeHex;
              return (
                <label
                  key={swatch.hex}
                  title={swatch.name}
                  className={cn(
                    "relative flex size-7 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-105 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]",
                    selected && "ring-2 ring-fg ring-offset-2 ring-offset-overlay"
                  )}
                  style={{ backgroundColor: swatch.hex }}
                >
                  <input
                    type="radio"
                    name={`tag-color-${tagName}`}
                    value={swatch.hex}
                    checked={selected}
                    onChange={() => {
                      onSelect(swatch.hex);
                      close();
                    }}
                    aria-label={swatch.name}
                    className="sr-only"
                  />
                  {selected ? <Check className="size-3.5 text-white stroke-[3]" /> : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </Popover>
  );
}

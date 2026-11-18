export interface TagSwatch {
  name: string;
  hex: string;
}

export const DEFAULT_TAG_COLOR = "#94A3B8";

export const TAG_PALETTE: TagSwatch[] = [
  { name: "Slate", hex: "#94A3B8" },
  { name: "Blue", hex: "#1D4ED8" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Red", hex: "#EF4444" },
  { name: "Orange", hex: "#F97316" },
  { name: "Amber", hex: "#EAB308" },
  { name: "Green", hex: "#22C55E" },
  { name: "Teal", hex: "#14B8A6" },
];

export function resolveTagColor(color?: string | null): string {
  if (!color || typeof color !== "string") return DEFAULT_TAG_COLOR;
  const trimmed = color.trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(trimmed) ? trimmed : DEFAULT_TAG_COLOR;
}

export function nextTagColor(existingColors: Array<string | null | undefined>): string {
  const normalized = new Set(existingColors.map((c) => resolveTagColor(c).toUpperCase()));
  const rotation = TAG_PALETTE.slice(1);
  const unused = rotation.find((swatch) => !normalized.has(swatch.hex.toUpperCase()));
  if (unused) return unused.hex;
  return rotation[existingColors.length % rotation.length]?.hex ?? DEFAULT_TAG_COLOR;
}

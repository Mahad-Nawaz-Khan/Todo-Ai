"use client";

import { Dialog } from "@/components/ui/Dialog";
import { Kbd } from "@/components/ui/Kbd";

interface ShortcutGroup {
  heading: string;
  items: Array<{ label: string; keys: string[] }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    heading: "General",
    items: [
      { label: "Command palette", keys: ["⌘", "K"] },
      { label: "Toggle AI assistant", keys: ["⌘", "J"] },
      { label: "New task", keys: ["C"] },
      { label: "Toggle sidebar", keys: ["⌘", "\\"] },
      { label: "Keyboard shortcuts", keys: ["?"] },
      { label: "Close dialog or drawer", keys: ["Esc"] },
    ],
  },
  {
    heading: "Navigation",
    items: [
      { label: "Go to Today", keys: ["G", "T"] },
      { label: "Go to Upcoming", keys: ["G", "U"] },
      { label: "Go to All tasks", keys: ["G", "A"] },
      { label: "Go to Completed", keys: ["G", "C"] },
      { label: "Go to Settings", keys: ["G", "S"] },
      { label: "Focus task filter", keys: ["/"] },
    ],
  },
  {
    heading: "Tasks",
    items: [
      { label: "Move selection", keys: ["J", "K"] },
      { label: "Complete selected task", keys: ["X"] },
      { label: "Open selected task", keys: ["↵"] },
      { label: "Delete selected task", keys: ["Del"] },
      { label: "Save changes in drawer", keys: ["⌘", "↵"] },
    ],
  },
];

export function ShortcutsDialog({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Keyboard shortcuts"
      description="Navigate and manage tasks without leaving the keyboard."
      width={640}
    >
      <div className="grid gap-6 pb-6 md:grid-cols-2">
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.heading} className="space-y-2">
            <h3 className="text-xs font-semibold text-fg-subtle">{group.heading}</h3>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li
                  key={item.label}
                  className="flex h-7 items-center justify-between gap-2 text-[13px] text-fg-muted"
                >
                  <span>{item.label}</span>
                  <span className="flex items-center gap-1">
                    {item.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}

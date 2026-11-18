"use client";

import { Command } from "cmdk";
import {
  CalendarDays,
  Circle,
  CircleCheck,
  ListTodo,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  SquarePen,
  Sun,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { DueChip } from "@/components/tasks/DueChip";
import { Dialog } from "@/components/ui/Dialog";
import { Kbd } from "@/components/ui/Kbd";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/context/TasksContext";
import { useTheme } from "@/context/ThemeContext";
import { useUI } from "@/context/UIContext";
import { useTags } from "@/hooks/useTags";
import { resolveTagColor } from "@/lib/tagColors";

const ITEM_CLASS =
  "flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm text-fg-muted outline-none transition-colors data-[selected=true]:bg-hover data-[selected=true]:text-fg [&[data-selected=true]_svg]:text-accent-text";

const GROUP_CLASS =
  "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-fg-subtle";

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { signOut } = useAuth();
  const { tasks } = useTasks();
  const { tags } = useTags();
  const { setTheme } = useTheme();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setQuickAddOpen,
    toggleAssistant,
  } = useUI();
  const [query, setQuery] = useState("");

  const close = () => {
    setCommandPaletteOpen(false);
    setQuery("");
  };

  const openTask = (taskId: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("task", String(taskId));
    const currentPath = pathname ?? "/today";
    const base = currentPath === "/chat" || currentPath === "/settings" ? "/today" : currentPath;
    router.push(`${base}?${params.toString()}`, { scroll: false });
    close();
  };

  const matchedTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const openFirst = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
    if (!q) return openFirst.slice(0, 6);
    return openFirst.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 6);
  }, [query, tasks]);

  return (
    <Dialog
      open={commandPaletteOpen}
      onClose={close}
      width={640}
      hideHeader
      className="mt-[12vh] mb-auto bg-overlay"
    >
      <Command label="Command palette" shouldFilter className="flex flex-col">
        <div className="flex h-12 items-center gap-2.5 border-b border-line-subtle px-3.5">
          <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search tasks, navigate, or run a command…"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
          />
          <Kbd>esc</Kbd>
        </div>

        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-fg-subtle">
            No matching tasks or commands.
          </Command.Empty>

          <Command.Group heading="Actions" className={GROUP_CLASS}>
            <Command.Item
              value="Create new task"
              className={ITEM_CLASS}
              onSelect={() => {
                close();
                setQuickAddOpen(true);
                if (pathname === "/chat" || pathname === "/settings") {
                  router.push("/today");
                }
              }}
            >
              <Plus className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">New task</span>
              <Kbd>C</Kbd>
            </Command.Item>

            <Command.Item
              value="Ask AI Assistant"
              className={ITEM_CLASS}
              onSelect={() => {
                close();
                toggleAssistant();
              }}
            >
              <Sparkles className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">Toggle AI assistant</span>
              <Kbd>⌘J</Kbd>
            </Command.Item>

            <Command.Item
              value="Start new chat"
              className={ITEM_CLASS}
              onSelect={() => {
                close();
                if (pathname !== "/chat") {
                  router.push("/chat");
                }
                window.setTimeout(() => {
                  window.dispatchEvent(new CustomEvent("todo:start-new-chat"));
                }, 80);
              }}
            >
              <SquarePen className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">New chat</span>
            </Command.Item>
          </Command.Group>

          {matchedTasks.length > 0 ? (
            <Command.Group heading="Tasks" className={GROUP_CLASS}>
              {matchedTasks.map((task) => (
                <Command.Item
                  key={task.id}
                  value={`task-${task.id} ${task.title}`}
                  className={ITEM_CLASS}
                  onSelect={() => openTask(task.id)}
                >
                  {task.completed ? (
                    <CircleCheck className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{task.title}</span>
                  <DueChip dueDate={task.due_date} completed={task.completed} />
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}

          <Command.Group heading="Navigation" className={GROUP_CLASS}>
            <Command.Item
              value="Go to Today"
              className={ITEM_CLASS}
              onSelect={() => {
                close();
                router.push("/today");
              }}
            >
              <Sun className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">Today</span>
              <span className="flex items-center gap-1">
                <Kbd>G</Kbd>
                <Kbd>T</Kbd>
              </span>
            </Command.Item>
            <Command.Item
              value="Go to Upcoming"
              className={ITEM_CLASS}
              onSelect={() => {
                close();
                router.push("/upcoming");
              }}
            >
              <CalendarDays className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">Upcoming</span>
              <span className="flex items-center gap-1">
                <Kbd>G</Kbd>
                <Kbd>U</Kbd>
              </span>
            </Command.Item>
            <Command.Item
              value="Go to All tasks"
              className={ITEM_CLASS}
              onSelect={() => {
                close();
                router.push("/tasks");
              }}
            >
              <ListTodo className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">All tasks</span>
              <span className="flex items-center gap-1">
                <Kbd>G</Kbd>
                <Kbd>A</Kbd>
              </span>
            </Command.Item>
            <Command.Item
              value="Go to Completed"
              className={ITEM_CLASS}
              onSelect={() => {
                close();
                router.push("/completed");
              }}
            >
              <CircleCheck className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">Completed</span>
              <span className="flex items-center gap-1">
                <Kbd>G</Kbd>
                <Kbd>C</Kbd>
              </span>
            </Command.Item>
            <Command.Item
              value="Go to Settings"
              className={ITEM_CLASS}
              onSelect={() => {
                close();
                router.push("/settings");
              }}
            >
              <Settings className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">Settings</span>
              <span className="flex items-center gap-1">
                <Kbd>G</Kbd>
                <Kbd>S</Kbd>
              </span>
            </Command.Item>
          </Command.Group>

          {tags.length > 0 ? (
            <Command.Group heading="Tags" className={GROUP_CLASS}>
              {tags.map((tag) => (
                <Command.Item
                  key={tag.id}
                  value={`tag #${tag.name}`}
                  className={ITEM_CLASS}
                  onSelect={() => {
                    close();
                    router.push(`/tags/${tag.id}`);
                  }}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: resolveTagColor(tag.color) }}
                  />
                  <span className="flex-1 truncate">#{tag.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}

          <Command.Group heading="Theme" className={GROUP_CLASS}>
            <Command.Item
              value="Theme Light"
              className={ITEM_CLASS}
              onSelect={() => {
                setTheme("light");
                close();
              }}
            >
              <Sun className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">Light theme</span>
            </Command.Item>
            <Command.Item
              value="Theme Dark"
              className={ITEM_CLASS}
              onSelect={() => {
                setTheme("dark");
                close();
              }}
            >
              <Moon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">Dark theme</span>
            </Command.Item>
            <Command.Item
              value="Theme System"
              className={ITEM_CLASS}
              onSelect={() => {
                setTheme("system");
                close();
              }}
            >
              <Monitor className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">System theme</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Account" className={GROUP_CLASS}>
            <Command.Item
              value="Sign out"
              className={ITEM_CLASS}
              onSelect={() => {
                close();
                void signOut();
              }}
            >
              <LogOut className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <span className="flex-1">Sign out</span>
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="flex h-9 items-center justify-between border-t border-line-subtle bg-surface-2 px-3.5 text-[11px] text-fg-subtle">
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span className="font-mono">Todo AI</span>
        </div>
      </Command>
    </Dialog>
  );
}

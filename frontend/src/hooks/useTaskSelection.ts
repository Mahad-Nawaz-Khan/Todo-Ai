"use client";

import { useMemo } from "react";

import { useUI } from "@/context/UIContext";
import { useHotkeys } from "@/hooks/useHotkeys";
import type { Task } from "@/types/task";

export interface UseTaskSelectionOptions {
  orderedTasks: Task[];
  onOpenTask: (taskId: number) => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  enabled?: boolean;
}

export function useTaskSelection({
  orderedTasks,
  onOpenTask,
  onToggleTask,
  onDeleteTask,
  enabled = true,
}: UseTaskSelectionOptions) {
  const { selectedTaskId, setSelectedTaskId } = useUI();

  const selectedTask = useMemo(
    () => orderedTasks.find((t) => t.id === selectedTaskId) ?? null,
    [orderedTasks, selectedTaskId]
  );

  const moveSelection = (delta: 1 | -1) => {
    if (!orderedTasks.length) return;
    const currentIdx = orderedTasks.findIndex((t) => t.id === selectedTaskId);
    if (currentIdx === -1) {
      const fallback = delta === 1 ? orderedTasks[0] : orderedTasks[orderedTasks.length - 1];
      setSelectedTaskId(fallback?.id ?? null);
      return;
    }
    const nextIdx = Math.min(Math.max(0, currentIdx + delta), orderedTasks.length - 1);
    setSelectedTaskId(orderedTasks[nextIdx]?.id ?? null);
  };

  useHotkeys([
    { combo: "j", when: enabled, handler: () => moveSelection(1) },
    { combo: "arrowdown", when: enabled, handler: () => moveSelection(1) },
    { combo: "k", when: enabled, handler: () => moveSelection(-1) },
    { combo: "arrowup", when: enabled, handler: () => moveSelection(-1) },
    {
      combo: "x",
      when: enabled && Boolean(selectedTask),
      handler: () => {
        if (selectedTask) onToggleTask(selectedTask);
      },
    },
    {
      combo: "enter",
      when: enabled && Boolean(selectedTask),
      handler: () => {
        if (selectedTask) onOpenTask(selectedTask.id);
      },
    },
    {
      combo: "e",
      when: enabled && Boolean(selectedTask),
      handler: () => {
        if (selectedTask) onOpenTask(selectedTask.id);
      },
    },
    {
      combo: "backspace",
      when: enabled && Boolean(selectedTask),
      handler: () => {
        if (selectedTask) onDeleteTask(selectedTask);
      },
    },
    {
      combo: "delete",
      when: enabled && Boolean(selectedTask),
      handler: () => {
        if (selectedTask) onDeleteTask(selectedTask);
      },
    },
  ]);

  return { selectedTaskId, setSelectedTaskId };
}

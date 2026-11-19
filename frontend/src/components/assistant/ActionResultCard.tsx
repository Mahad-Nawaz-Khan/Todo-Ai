"use client";

import { CheckCircle2, ListFilter, PencilLine, Search, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { TaskViewAction } from "@/services/chatService";
import { cn } from "@/lib/utils";

export interface OperationShape {
  type?: string;
  count?: number;
  task_id?: number;
  view?: TaskViewAction;
}

type OpTone = "success" | "accent" | "danger" | "warning";

const TILE_CLASSES: Record<OpTone, string> = {
  success: "bg-success-subtle text-success",
  accent: "bg-accent-subtle text-accent-text",
  danger: "bg-danger-subtle text-danger",
  warning: "bg-warning-subtle text-warning",
};

function formatTaskDetail(taskId: number | undefined, suffix: string, fallback: string): string {
  return taskId ? `Task #${taskId} ${suffix}` : fallback;
}

function formatSearchDetail(count?: number): string {
  if (typeof count !== "number") {
    return "Inspected your tasks.";
  }
  const plural = count === 1 ? "" : "s";
  return `Found ${count} matching task${plural}.`;
}

function getOperationMeta(op: OperationShape): {
  title: string;
  detail: string;
  tone: OpTone;
  icon: typeof Sparkles;
} {
  const type = (op.type ?? "").toUpperCase();

  if (type.includes("SET_TASK_VIEW")) {
    return {
      title: "View updated",
      detail: "Task list filters now match your request.",
      tone: "warning",
      icon: ListFilter,
    };
  }
  if (type.includes("CREATE")) {
    return {
      title: "Task created",
      detail: formatTaskDetail(op.task_id, "added to your workspace.", "New task created."),
      tone: "success",
      icon: CheckCircle2,
    };
  }
  if (type.includes("UPDATE") || type.includes("EDIT")) {
    return {
      title: "Task updated",
      detail: formatTaskDetail(op.task_id, "has been updated.", "Task updated."),
      tone: "accent",
      icon: PencilLine,
    };
  }
  if (type.includes("DELETE")) {
    return {
      title: "Task deleted",
      detail: formatTaskDetail(op.task_id, "was removed.", "Task removed."),
      tone: "danger",
      icon: Trash2,
    };
  }
  if (type.includes("READ") || type.includes("SEARCH") || type.includes("LIST")) {
    return {
      title: "Tasks searched",
      detail: formatSearchDetail(op.count),
      tone: "warning",
      icon: Search,
    };
  }
  return {
    title: "Action completed",
    detail: "Workspace updated.",
    tone: "accent",
    icon: Sparkles,
  };
}

export interface ActionResultCardProps {
  operation: OperationShape;
  onViewTask?: (taskId: number) => void;
  onViewFiltered?: (view: TaskViewAction) => void;
}

export function ActionResultCard({
  operation,
  onViewTask,
  onViewFiltered,
}: Readonly<ActionResultCardProps>) {
  const meta = getOperationMeta(operation);
  const Icon = meta.icon;

  const canViewTask = Boolean(operation.task_id && onViewTask && !(operation.type ?? "").toUpperCase().includes("DELETE"));
  const canViewFilter = Boolean(operation.view && onViewFiltered);

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2 p-2.5">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md",
          TILE_CLASSES[meta.tone]
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-fg">{meta.title}</div>
        <div className="truncate text-xs text-fg-muted">{meta.detail}</div>
      </div>

      {canViewTask ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewTask?.(operation.task_id!)}
          className="text-accent-text"
        >
          View
        </Button>
      ) : null}

      {!canViewTask && canViewFilter ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewFiltered?.(operation.view!)}
          className="text-accent-text"
        >
          View
        </Button>
      ) : null}
    </div>
  );
}

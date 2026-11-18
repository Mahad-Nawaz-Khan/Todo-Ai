import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TaskRow } from "@/components/tasks/TaskRow";
import type { Task } from "@/types/task";

const mockTask: Task = {
  id: 42,
  title: "Review PR #42",
  description: "Check auth refactor",
  completed: false,
  priority: "HIGH",
  due_date: "2026-11-18T00:00:00",
  recurrence_rule: "WEEKLY",
  created_at: "2026-11-18T08:00:00Z",
  updated_at: "2026-11-18T08:00:00Z",
  tags: [{ id: 1, name: "work", color: "#1D4ED8" }],
};

describe("TaskRow", () => {
  it("renders title, tag chip, and accessible completion checkbox", () => {
    const onOpen = vi.fn();
    const onToggle = vi.fn();

    render(
      <ul>
        <TaskRow
          task={mockTask}
          onOpen={onOpen}
          onToggle={onToggle}
          onQuickUpdate={vi.fn()}
          onDelete={vi.fn()}
        />
      </ul>
    );

    expect(screen.getByText("Review PR #42")).toBeInTheDocument();
    expect(screen.getByText("work")).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox", { name: /Complete “Review PR #42”/i });
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith(mockTask);
    expect(onOpen).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^Review PR #42/i }));
    expect(onOpen).toHaveBeenCalledWith(42);
  });
});

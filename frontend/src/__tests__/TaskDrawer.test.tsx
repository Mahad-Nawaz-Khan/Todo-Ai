import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import type { Task } from "@/types/task";

const mockReplace = vi.fn();
const mockUpdateTask = vi.fn().mockResolvedValue(null);
const mockDeleteTask = vi.fn().mockResolvedValue(true);
const mockConfirm = vi.fn().mockResolvedValue(true);

const sampleTask: Task = {
  id: 7,
  title: "Write launch checklist",
  description: "Verify mobile layout",
  completed: false,
  priority: "MEDIUM",
  due_date: "2026-11-20T00:00:00",
  recurrence_rule: null,
  created_at: "2026-11-18T09:00:00Z",
  updated_at: "2026-11-18T10:00:00Z",
  tags: [{ id: 2, name: "work", color: "#1D4ED8" }],
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => "/today",
  useSearchParams: () => new URLSearchParams("task=7"),
}));

vi.mock("@/context/TasksContext", () => ({
  useTasks: () => ({
    tasks: [sampleTask],
    updateTask: mockUpdateTask,
    deleteTask: mockDeleteTask,
  }),
}));

vi.mock("@/hooks/useTags", () => ({
  useTags: () => ({
    tags: [{ id: 2, name: "work", color: "#1D4ED8" }],
    isLoading: false,
  }),
}));

vi.mock("@/context/UIContext", () => ({
  useUI: () => ({
    confirm: mockConfirm,
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("token"),
  }),
}));

describe("TaskDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Save bar only when dirty and saves updated payload", async () => {
    render(<TaskDrawer />);

    const titleInput = screen.getByLabelText("Task title");
    expect(titleInput).toHaveValue("Write launch checklist");
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();

    fireEvent.change(titleInput, { target: { value: "Updated checklist" } });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Save/i }));
    expect(mockUpdateTask).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        title: "Updated checklist",
        description: "Verify mobile layout",
        priority: "MEDIUM",
        due_date: "2026-11-20",
      }),
      expect.any(Array)
    );
  });
});

"use client";

import { useParams } from "next/navigation";

import { TaskView } from "@/components/tasks/TaskView";

export default function TagTasksPage() {
  const params = useParams<{ tagId: string }>();
  const tagId = Number(params?.tagId);

  if (!Number.isFinite(tagId) || tagId <= 0) {
    return <TaskView view="tasks" />;
  }

  return <TaskView view="tag" tagId={tagId} />;
}

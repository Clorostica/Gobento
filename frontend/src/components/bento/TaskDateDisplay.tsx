import React from "react";
import type { Task } from "@/types/tasks/task.types";

interface TaskDateDisplayProps {
  task: Task;
}

const TaskDateDisplay: React.FC<TaskDateDisplayProps> = ({ task }) => {
  if (!task.dueDate || typeof task.dueDate !== "string") return null;

  const isOverdue =
    new Date(task.dueDate) < new Date() && task.status !== "happened";

  return (
    <div className="mb-2 text-sm text-white opacity-90 flex items-center gap-2 flex-wrap">
      <span className="flex items-center gap-2 font-medium">
        <span className="text-base">📅</span>
        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
        {task.startTime && (
          <span className="flex items-center gap-1.5 ml-2">
            <span className="text-base">🕐</span>
            <span>{task.startTime}</span>
          </span>
        )}
      </span>
      {isOverdue && (
        <span className="bg-red-900 bg-opacity-80 text-white px-2 py-1 rounded text-xs font-semibold animate-pulse border border-red-600">
          ⚠️ Overdue
        </span>
      )}
    </div>
  );
};

export default TaskDateDisplay;

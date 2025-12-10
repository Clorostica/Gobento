import React from "react";
import type { Task } from "@/types/tasks/task.types";

interface TaskDateDisplayProps {
  task: Task;
}

const TaskDateDisplay: React.FC<TaskDateDisplayProps> = ({ task }) => {
  if (!task.dueDate || typeof task.dueDate !== "string") return null;

  let formattedDate = "";
  let isOverdue = false;

  try {
    const dueDate = new Date(task.dueDate);

    if (!isNaN(dueDate.getTime())) {
      formattedDate = dueDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      isOverdue = dueDate < today && task.status !== "happened";
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }

  let displayTime = "";
  if (task.startTime) {
    try {
      if (task.startTime.includes("T")) {
        const timeDate = new Date(task.startTime);
        if (!isNaN(timeDate.getTime())) {
          displayTime = timeDate.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } else {
        displayTime = task.startTime;
      }
    } catch (error) {
      console.error("Error parsing time:", error);
    }
  }

  return (
    <div className="mb-2 text-sm text-white opacity-90 flex items-center gap-2 flex-wrap">
      <span className="flex items-center gap-2 font-medium">
        <span className="text-base">📅</span>
        <span>{formattedDate}</span>
        {displayTime && (
          <span className="flex items-center gap-1.5 ml-2">
            <span className="text-base">🕐</span>
            <span>{displayTime}</span>
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

import React, { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Task } from "@/types/tasks/task.types";
import MagicBento from "./MagicBento";
import { getTasks, saveTasks } from "../utils/storage";

const API_URL = import.meta.env.VITE_API as string;

const COLOR_CLASSES = [
  "bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200 hover:border-gray-300 shadow-sm",
  "bg-gradient-to-br from-blue-50/80 to-blue-100/40 border-blue-200/60 hover:border-blue-300 shadow-sm",
  "bg-gradient-to-br from-purple-50/80 to-purple-100/40 border-purple-200/60 hover:border-purple-300 shadow-sm",
  "bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 border-emerald-200/60 hover:border-emerald-300 shadow-sm",
  "bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200 hover:border-slate-300 shadow-sm",
  "bg-gradient-to-br from-indigo-50/80 to-indigo-100/40 border-indigo-200/60 hover:border-indigo-300 shadow-sm",
  "bg-gradient-to-br from-cyan-50/80 to-cyan-100/40 border-cyan-200/60 hover:border-cyan-300 shadow-sm",
  "bg-gradient-to-br from-violet-50/80 to-violet-100/40 border-violet-200/60 hover:border-violet-300 shadow-sm",
] as const;

interface TodoListProps {
  todos: Task[];
  setTodos: React.Dispatch<React.SetStateAction<Task[]>>;
  search: string;
  token: string | null;
  isAuthenticated: boolean;
}

type TaskStatus = "todo" | "progress" | "completed";

const getRandomColorClass = (): string => {
  const index = Math.floor(Math.random() * COLOR_CLASSES.length);
  return COLOR_CLASSES[index] || COLOR_CLASSES[0];
};

const filterTasksBySearch = (tasks: Task[], searchTerm: string): Task[] => {
  if (!searchTerm) return tasks;
  const lowerSearch = searchTerm.toLowerCase();
  return tasks.filter((task) =>
    (task.text || "").toLowerCase().includes(lowerSearch)
  );
};

const useTaskOperations = (
  todos: Task[],
  setTodos: React.Dispatch<React.SetStateAction<Task[]>>,
  token: string | null,
  isAuthenticated: boolean
) => {
  const handleError = useCallback((operation: string, error: unknown) => {
    console.error(`Error ${operation} task:`, error);
    alert(`Oops! Something went wrong ${operation} your task 😕`);
  }, []);

  const addTask = useCallback(
    async (status: TaskStatus = "todo") => {
      const newTask: Task = {
        id: uuidv4(),
        status,
        text: "",
        colorClass: getRandomColorClass(),
      };

      setTodos((prev) => [...prev, newTask]);

      if (!isAuthenticated) {
        const existingTasks = getTasks();
        saveTasks([...existingTasks, newTask]);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/tasks`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTask),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        setTodos((prev) => prev.filter((task) => task.id !== newTask.id));
        handleError("creating", error);
      }
    },
    [isAuthenticated, token, setTodos, handleError]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const previousTodos = todos;
      setTodos((prev) => prev.filter((task) => task.id !== taskId));

      if (!isAuthenticated) {
        const tasks = getTasks();
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        saveTasks(updatedTasks);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        setTodos(previousTodos);
        handleError("deleting", error);
      }
    },
    [todos, isAuthenticated, token, setTodos, handleError]
  );

  const editTask = useCallback(
    async (id: string, newText: string) => {
      const task = todos.find((t) => t.id === id);
      if (!task) return;

      const updatedTask = { ...task, text: newText };
      const previousTodos = todos;

      setTodos((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));

      if (!isAuthenticated) {
        const localTasks = getTasks();
        const updatedTasks = localTasks.map((t) =>
          t.id === id ? updatedTask : t
        );
        saveTasks(updatedTasks);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: newText,
            status: task.status,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        setTodos(previousTodos);
        handleError("editing", error);
      }
    },
    [todos, isAuthenticated, token, setTodos, handleError]
  );

  const changeTaskStatus = useCallback(
    async (
      taskId: string,
      newStatus: TaskStatus,
      position: number | null = null
    ) => {
      const task = todos.find((t) => t.id === taskId);
      if (!task) {
        console.error("Task not found:", taskId);
        return;
      }

      const updatedTask = { ...task, status: newStatus };
      const previousTodos = todos;

      setTodos((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

      if (!isAuthenticated) {
        const localTasks = getTasks();
        const updatedTasks = localTasks.map((t) =>
          t.id === taskId ? updatedTask : t
        );
        saveTasks(updatedTasks);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: task.text,
            status: newStatus,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("✅ Task status updated:", updatedTask);
      } catch (error) {
        setTodos(previousTodos);
        handleError("updating", error);
      }
    },
    [todos, isAuthenticated, token, setTodos, handleError]
  );

  return {
    addTask,
    deleteTask,
    editTask,
    changeTaskStatus,
  };
};

export default function TodoList({
  todos,
  setTodos,
  search,
  token,
  isAuthenticated,
}: TodoListProps) {
  const { addTask, deleteTask, editTask, changeTaskStatus } = useTaskOperations(
    todos,
    setTodos,
    token,
    isAuthenticated
  );

  const filteredTodos = useMemo(
    () => filterTasksBySearch(todos, search),
    [todos, search]
  );

  return (
    <div className="w-full">
      <MagicBento
        textAutoHide
        enableStars
        enableSpotlight
        enableBorderGlow
        enableTilt
        enableMagnetism
        clickEffect
        spotlightRadius={300}
        particleCount={12}
        glowColor="132, 0, 255"
        tasks={filteredTodos}
        onEdit={editTask}
        onDelete={deleteTask}
        onStatusChange={(id, newStatus) =>
          changeTaskStatus(id, newStatus as TaskStatus)
        }
        addTask={(status) => addTask(status as TaskStatus)}
      />
    </div>
  );
}

import type { Event } from "@/types/tasks/task.types";
import MagicBento from "./MagicBento";
import UserProfile from "./UserProfile";

interface Props {
  todos: Event[];
  search: string;
  filter: "all" | "planned" | "upcoming" | "happened" | "liked";
}

export default function ReadOnlyTodoList({ todos, search, filter }: Props) {
  return <MagicBento tasks={todos} currentFilter={filter} />;
}

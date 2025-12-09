import type { Event } from "@/types/tasks/task.types";
import MagicBento from "./MagicBento";

interface Props {
  todos: Event[];
  search: string;
  filter: "all" | "planned" | "upcoming" | "happened" | "liked";
  isFollowing?: boolean;
}

export default function ReadOnlyTodoList({
  todos,
  search,
  filter,
  isFollowing = true,
}: Props) {
  return (
    <MagicBento
      tasks={todos}
      currentFilter={filter}
      isFollowing={isFollowing}
    />
  );
}

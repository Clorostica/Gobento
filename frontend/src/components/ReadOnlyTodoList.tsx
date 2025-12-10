import type { Event } from "@/types/tasks/task.types";
import MagicBento from "./MagicBento";

interface Props {
  todos: Event[];
  search: string;
  filter:
    | "all"
    | "planned"
    | "upcoming"
    | "happened"
    | "private"
    | "liked"
    | "friends";
  isFollowing?: boolean;
  onCopyEvent?: (event: Event) => void;
  copiedEventIds?: Set<string>;
  copyingEventId?: string | null;
}

export default function ReadOnlyTodoList({
  todos,
  search,
  filter,
  isFollowing = true,
  onCopyEvent,
  copiedEventIds,
  copyingEventId,
}: Props) {
  return (
    <MagicBento
      tasks={todos}
      currentFilter={filter}
      isFollowing={isFollowing}
      isReadOnly={true}
      {...(onCopyEvent ? { onCopyEvent } : {})}
      {...(copiedEventIds ? { copiedEventIds } : {})}
      {...(copyingEventId !== undefined ? { copyingEventId } : {})}
    />
  );
}

import type { TaskDefinition } from "../core/types.ts";
import task2 from "./task2/task.ts";
import task1Academic from "./task1-academic/task.ts";
import task1General from "./task1-general/task.ts";

/** Every task the playground knows (server side). Add a new task here AND in screens.ts. */
export const TASKS: Record<string, TaskDefinition> = {
  [task2.id]: task2,
  [task1Academic.id]: task1Academic,
  [task1General.id]: task1General,
};

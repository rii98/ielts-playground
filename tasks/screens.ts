import type { ComponentType } from "react";
import type { FeedbackProps } from "../core/types.ts";
import Task2Feedback from "./task2/Feedback.tsx";
import Task1AcademicFeedback from "./task1-academic/Feedback.tsx";
import Task1GeneralFeedback from "./task1-general/Feedback.tsx";

/** Every task's feedback screen (browser side). Add a new task here AND in index.ts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SCREENS: Record<string, ComponentType<FeedbackProps<any>>> = {
  task2: Task2Feedback,
  "task1-academic": Task1AcademicFeedback,
  "task1-general": Task1GeneralFeedback,
};

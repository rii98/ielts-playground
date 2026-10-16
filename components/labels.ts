import type { Criterion } from "../core/types.ts";

/** Criterion names as students see them. `task_achievement` is "Task Response" on Task 2. */
export function criterionLabel(id: Criterion, task: 1 | 2): string {
  switch (id) {
    case "task_achievement":
      return task === 2 ? "Task Response" : "Task Achievement";
    case "coherence_cohesion":
      return "Coherence & Cohesion";
    case "lexical_resource":
      return "Lexical Resource";
    case "grammatical_range_accuracy":
      return "Grammatical Range & Accuracy";
  }
}

export const CATEGORY_LABELS: Record<string, string> = {
  grammar: "Grammar",
  lexis: "Vocabulary",
  cohesion: "Cohesion",
  task_response: "Task response",
  register: "Register",
  spelling: "Spelling",
};

export function categoryLabel(id: string): string {
  return CATEGORY_LABELS[id] ?? id.replace(/_/g, " ");
}

/** Show a band as "6" or "6.5". */
export function formatBand(band: number): string {
  return Number.isInteger(band) ? band.toFixed(0) : band.toFixed(1);
}

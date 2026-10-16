import { fenceEssay, fill, jsonSchemaOf, readTaskFile } from "../../core/prompt.ts";
import type { TaskDefinition } from "../../core/types.ts";
import { lengthNote } from "../length-note.ts";
import { schema } from "./schema.ts";

const here = import.meta.url;

/** Task 2 — the argument essay. Prompt text lives in system.md / user.md / rubric.md. */
export default {
  id: "task2",
  label: "Task 2 · Essay",
  minWords: 250,
  schema,
  buildPrompt: (input) => ({
    system: fill(readTaskFile(here, "system.md"), {
      RUBRIC: readTaskFile(here, "rubric.md"),
      OUTPUT_SCHEMA: JSON.stringify(jsonSchemaOf(schema)),
    }),
    user: fill(readTaskFile(here, "user.md"), {
      WORD_COUNT: String(input.wordCount),
      LENGTH_NOTE: lengthNote(2, 250, input.wordCount),
      QUESTION: input.question,
      ESSAY: fenceEssay(input.essay),
    }),
  }),
} satisfies TaskDefinition<typeof schema>;

import { fenceEssay, fill, jsonSchemaOf, readTaskFile } from "../../core/prompt.ts";
import type { TaskDefinition } from "../../core/types.ts";
import { lengthNote } from "../length-note.ts";
import { schema } from "./schema.ts";

const here = import.meta.url;

/** General Training Task 1 — the letter. Prompt text lives in system.md / user.md / rubric.md. */
export default {
  id: "task1-general",
  label: "Task 1 · GT letter",
  minWords: 150,
  schema,
  buildPrompt: (input) => ({
    system: fill(readTaskFile(here, "system.md"), {
      RUBRIC: readTaskFile(here, "rubric.md"),
      OUTPUT_SCHEMA: JSON.stringify(jsonSchemaOf(schema)),
    }),
    user: fill(readTaskFile(here, "user.md"), {
      WORD_COUNT: String(input.wordCount),
      LENGTH_NOTE: lengthNote(1, 150, input.wordCount),
      QUESTION: input.question,
      ESSAY: fenceEssay(input.essay),
    }),
  }),
} satisfies TaskDefinition<typeof schema>;

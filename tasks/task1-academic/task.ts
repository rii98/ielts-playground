import { fenceEssay, fill, jsonSchemaOf, readTaskFile } from "../../core/prompt.ts";
import type { TaskDefinition } from "../../core/types.ts";
import { lengthNote } from "../length-note.ts";
import { schema } from "./schema.ts";

const here = import.meta.url;

/**
 * Academic Task 1 — describing a chart. The chart image is attached to the model
 * call; the optional `data` (the chart's true figures) is pasted into the prompt.
 */
export default {
  id: "task1-academic",
  label: "Task 1 · Academic chart",
  minWords: 150,
  needsImage: true,
  schema,
  buildPrompt: (input) => ({
    system: fill(readTaskFile(here, "system.md"), {
      RUBRIC: readTaskFile(here, "rubric.md"),
      OUTPUT_SCHEMA: JSON.stringify(jsonSchemaOf(schema)),
      DATA_BLOCK: input.data?.trim()
        ? "GROUND-TRUTH DATA for the attached visual (authored and verified — trust it over your reading of the image):\n" + input.data.trim()
        : "No data table was supplied; read the figures from the attached image as carefully as you can.",
    }),
    user: fill(readTaskFile(here, "user.md"), {
      WORD_COUNT: String(input.wordCount),
      LENGTH_NOTE: lengthNote(1, 150, input.wordCount),
      QUESTION: input.question,
      ESSAY: fenceEssay(input.essay),
    }),
  }),
} satisfies TaskDefinition<typeof schema>;

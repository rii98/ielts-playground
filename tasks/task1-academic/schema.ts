import { z } from "zod";
import { CRITERIA } from "../../core/types.ts";

/**
 * What the model must return for this task. Sent to Ollama as the decoding grammar
 * AND pasted into the prompt, so field descriptions are instructions to the model.
 *
 * LOCKED CORE (see CLAUDE.md): `criteria` — the four ids, each with a whole-number
 * `band` 0–9. Everything else here is free to change; when you change it, update
 * Feedback.tsx and example-output.json to match.
 *
 * Any object with a `quote` field gets `start`/`end` added by code (its position in
 * the essay) — and is dropped if the quote is not really in the essay.
 */

const criterion = z.object({
  criterion: z.enum(CRITERIA),
  band: z.number().int().min(0).max(9),
  evidence: z.string(),
  feedback: z.string(),
});

const annotation = z.object({
  quote: z.string().min(1),
  category: z.enum(["grammar", "lexis", "cohesion", "task_response", "register", "spelling"]),
  why: z.string(),
  suggestion: z.string(),
});

const dataCheck = z.object({
  quote: z.string(),
  stated: z.string(),
  actual: z.string(),
  note: z.string(),
});

export const schema = z.object({
  headline: z.string(),
  priorityCriterion: z.enum(CRITERIA),
  criteria: z.array(criterion).length(4),
  annotations: z.array(annotation).max(5),
  modelRewrite: z.object({ original: z.string(), rewritten: z.string(), whatChanged: z.string() }).optional(),
  nextActions: z.array(z.string()).max(2),
  checks: z.object({
    underWordCount: z.boolean(),
    offTopic: z.boolean(),
    memorisedTemplate: z.boolean(),
  }),
  dataChecks: z.array(dataCheck).max(8),
});

export type Output = z.infer<typeof schema>;

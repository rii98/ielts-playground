import type { z, ZodTypeAny } from "zod";

/**
 * Shapes shared by the whole playground. LOCKED (see CLAUDE.md): tasks plug into
 * these; they do not change them.
 */

/** The four IELTS Writing criteria — the ids every task's output must use. */
export const CRITERIA = [
  "task_achievement",
  "coherence_cohesion",
  "lexical_resource",
  "grammatical_range_accuracy",
] as const;
export type Criterion = (typeof CRITERIA)[number];

/** One essay in a task's `samples/` folder. */
export interface Sample {
  /** The file name without `.json` — filled in when the sample is loaded. */
  id: string;
  title: string;
  /** The task exactly as the candidate saw it. */
  question: string;
  /** The candidate's response. */
  essay: string;
  /** Academic Task 1 only: an image file in the same `samples/` folder. */
  image?: string;
  /** Academic Task 1 only: the chart's true figures, as plain text (optional). */
  data?: string;
  /** The teacher's own bands, whole numbers 0–9. `null` until the teacher has marked it. */
  teacherBands?: Record<Criterion, number> | null;
  notes?: string;
}

/** What a task's prompt builder receives for one run. */
export interface MarkInput {
  question: string;
  essay: string;
  wordCount: number;
  /** Plain-text chart data (Academic Task 1), if supplied. */
  data?: string;
  /** Whether a chart image is attached to this run. */
  hasImage: boolean;
}

export interface BuiltPrompt {
  system: string;
  user: string;
}

/** A task: everything that makes Task 2 different from Task 1. Lives in `tasks/<id>/task.ts`. */
export interface TaskDefinition<S extends ZodTypeAny = ZodTypeAny> {
  id: string;
  label: string;
  minWords: number;
  /** Academic Task 1: the model must see the chart, so a run without one is refused. */
  needsImage?: boolean;
  /** The output the model must return (also sent to Ollama as the decoding grammar). */
  schema: S;
  buildPrompt(input: MarkInput): BuiltPrompt;
  /** Optional per-task model settings; defaults come from `.env`. */
  model?: string;
  temperature?: number;
}

export interface Span {
  start: number;
  end: number;
}

/**
 * The model's output after grounding: every object that carries a `quote` also
 * carries the `start`/`end` of that quote in the essay (located by code, never by
 * the model). Quotes that could not be found are removed.
 */
export type WithSpans<T> = T extends Array<infer U>
  ? WithSpans<U>[]
  : T extends object
    ? { [K in keyof T]: WithSpans<T[K]> } & (T extends { quote: string } ? Span : unknown)
    : T;

export type Grounded<S extends ZodTypeAny> = WithSpans<z.infer<S>>;

/** The result of one run, as the feedback screen receives it. */
export interface MarkSuccess<T = unknown> {
  ok: true;
  taskId: string;
  model: string;
  latencyMs: number;
  wordCount: number;
  /** Mean of the four criterion bands, rounded to the nearest half band — computed in code. */
  overall: number;
  bands: Record<Criterion, number>;
  output: T;
  /** Quotes the model flagged that are not in the essay (hallucinations) — dropped. */
  droppedQuotes: string[];
  prompt: BuiltPrompt;
  raw: unknown;
}

export interface MarkFailure {
  ok: false;
  taskId: string;
  model: string;
  /** Where it broke: the call itself, the JSON, the task's schema, or the locked core fields. */
  stage: "request" | "json" | "schema" | "core";
  error: string;
  latencyMs: number;
  prompt?: BuiltPrompt;
  raw?: unknown;
  content?: string;
}

export type MarkResult<T = unknown> = MarkSuccess<T> | MarkFailure;

/** Props every task's `Feedback.tsx` receives. */
export interface FeedbackProps<T> {
  result: MarkSuccess<T>;
  /** The essay that was marked — for highlighting quotes. */
  essay: string;
  question: string;
}

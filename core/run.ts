import { TASKS } from "../tasks/index.ts";
import { chat, settings } from "./ollama.ts";
import { extractJson } from "./json.ts";
import { groundQuotes } from "./ground.ts";
import { normaliseCriteria, overallBand, readBands } from "./contract.ts";
import { countWords, jsonSchemaOf } from "./prompt.ts";
import { loadSample, readSampleImage } from "./samples.ts";
import type { BuiltPrompt, MarkResult, TaskDefinition } from "./types.ts";

/**
 * One marking run, start to finish. LOCKED.
 *
 *   build prompt → call model (schema-constrained) → parse JSON → check task schema
 *   → check locked core fields → ground quotes → compute overall band
 *
 * Never throws: every failure comes back as `{ ok: false, stage, error }` with as
 * much as was produced, so the teacher sees WHERE it broke.
 */

export interface RunRequest {
  taskId: string;
  question: string;
  essay: string;
  data?: string;
  /** Base64 image (no data: prefix). */
  imageBase64?: string;
  /** A sample whose image should be attached when no image was uploaded. */
  sampleId?: string;
}

export function getTask(taskId: string): TaskDefinition {
  const task = TASKS[taskId];
  if (!task) throw new Error(`Unknown task "${taskId}". Known: ${Object.keys(TASKS).join(", ")}`);
  return task;
}

export async function mark(req: RunRequest): Promise<MarkResult> {
  const task = getTask(req.taskId);
  const model = task.model ?? settings().model;
  const started = Date.now();
  const fail = (stage: "request" | "json" | "schema" | "core", error: string, extra: object = {}): MarkResult => ({
    ok: false,
    taskId: task.id,
    model,
    stage,
    error,
    latencyMs: Date.now() - started,
    ...extra,
  });

  let image = req.imageBase64;
  if (!image && req.sampleId) {
    const sample = loadSample(task.id, req.sampleId);
    if (sample.image) image = readSampleImage(task.id, sample.image).bytes.toString("base64");
  }
  if (task.needsImage && !image) return fail("request", "This task needs the chart image — add one before running.");

  const wordCount = countWords(req.essay);
  let prompt: BuiltPrompt;
  try {
    prompt = task.buildPrompt({ question: req.question, essay: req.essay, wordCount, data: req.data, hasImage: !!image });
  } catch (err) {
    return fail("request", `Could not build the prompt: ${message(err)}`);
  }

  let content: string;
  try {
    ({ content } = await chat({
      system: prompt.system,
      user: prompt.user,
      images: image ? [image] : undefined,
      format: jsonSchemaOf(task.schema),
      model,
      temperature: task.temperature,
    }));
  } catch (err) {
    return fail("request", message(err), { prompt });
  }

  let raw: unknown;
  try {
    raw = normaliseCriteria(extractJson(content));
  } catch (err) {
    return fail("json", message(err), { prompt, content });
  }

  const parsed = task.schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "(top level)"}: ${i.message}`).join("; ");
    return fail("schema", `Output does not match schema.ts — ${issues}`, { prompt, raw });
  }

  const bands = readBands(parsed.data);
  if (!bands.ok) return fail("core", bands.error, { prompt, raw });

  const { value: output, dropped } = groundQuotes(parsed.data, req.essay);
  return {
    ok: true,
    taskId: task.id,
    model,
    latencyMs: Date.now() - started,
    wordCount,
    overall: overallBand(bands.bands),
    bands: bands.bands,
    output,
    droppedQuotes: dropped,
    prompt,
    raw,
  };
}

function message(err: unknown): string {
  if (err instanceof Error && err.name === "TimeoutError") return "The model took too long to answer (timed out). Try again.";
  return err instanceof Error ? err.message : String(err);
}

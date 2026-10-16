import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TASKS } from "../tasks/index.ts";
import { mark, getTask, type RunRequest } from "./run.ts";
import { listSamples, readSampleImage } from "./samples.ts";
import { groundQuotes } from "./ground.ts";
import { normaliseCriteria, overallBand, readBands } from "./contract.ts";
import { countWords } from "./prompt.ts";
import { TASKS_DIR } from "./paths.ts";
import type { MarkResult } from "./types.ts";

/** The dev server's /api routes (wired in vite.config.ts). LOCKED. */

type Out =
  | { kind: "json"; json: unknown; status?: number }
  | { kind: "file"; bytes: Buffer; contentType: string };

export async function route(path: string, q: URLSearchParams, body: unknown): Promise<Out> {
  switch (path) {
    case "/tasks":
      return json(
        Object.values(TASKS).map((t) => ({ id: t.id, label: t.label, minWords: t.minWords, needsImage: !!t.needsImage })),
      );
    case "/samples":
      return json(listSamples(q.get("task") ?? ""));
    case "/sample-image": {
      const { bytes, contentType } = readSampleImage(q.get("task") ?? "", q.get("file") ?? "");
      return { kind: "file", bytes, contentType };
    }
    case "/mark":
      return json(await mark(body as RunRequest));
    case "/example":
      return json(example(q.get("task") ?? ""));
    default:
      return json({ error: `No route ${path}` }, 404);
  }
}

/**
 * `tasks/<task>/example-output.json` turned into a MarkResult without calling the
 * model — so the feedback screen can be designed instantly. Format:
 * `{ "sampleId": "...", "output": { ...exactly what the model would return... } }`
 */
export function example(taskId: string): { sampleId: string; result: MarkResult } | { error: string } {
  const task = getTask(taskId);
  const file = join(TASKS_DIR, task.id, "example-output.json");
  if (!existsSync(file)) return { error: "This task has no example-output.json yet." };
  const { sampleId, output } = JSON.parse(readFileSync(file, "utf8")) as { sampleId: string; output: unknown };
  const sample = listSamples(task.id).find((s) => s.id === sampleId);
  if (!sample) return { error: `example-output.json points at sample "${sampleId}", which does not exist.` };
  const parsed = task.schema.safeParse(normaliseCriteria(output));
  if (!parsed.success) return { error: "example-output.json no longer matches schema.ts — run `npm run check`." };
  const bands = readBands(parsed.data);
  if (!bands.ok) return { error: bands.error };
  const grounded = groundQuotes(parsed.data, sample.essay);
  const result: MarkResult = {
    ok: true,
    taskId: task.id,
    model: "example (no model call)",
    latencyMs: 0,
    wordCount: countWords(sample.essay),
    overall: overallBand(bands.bands),
    bands: bands.bands,
    output: grounded.value,
    droppedQuotes: grounded.dropped,
    prompt: { system: "(example — no prompt was sent)", user: "" },
    raw: output,
  };
  return { sampleId, result };
}

function json(value: unknown, status?: number): Out {
  return { kind: "json", json: value, status };
}

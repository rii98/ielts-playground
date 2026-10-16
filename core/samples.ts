import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TASKS_DIR } from "./paths.ts";
import { CRITERIA, type Sample } from "./types.ts";

/** Sample essays live in `tasks/<task>/samples/*.json`. LOCKED. */

const SAFE = /^[\w.-]+$/;

export function samplesDir(taskId: string): string {
  if (!SAFE.test(taskId)) throw new Error(`Bad task id: ${taskId}`);
  return join(TASKS_DIR, taskId, "samples");
}

export function listSamples(taskId: string): Sample[] {
  const dir = samplesDir(taskId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => loadSample(taskId, f.replace(/\.json$/, "")));
}

export function loadSample(taskId: string, id: string): Sample {
  if (!SAFE.test(id)) throw new Error(`Bad sample id: ${id}`);
  const file = join(samplesDir(taskId), `${id}.json`);
  const s = JSON.parse(readFileSync(file, "utf8")) as Omit<Sample, "id">;
  return { ...s, id };
}

/** Problems with a sample file, in plain words (empty = fine). */
export function sampleProblems(taskId: string, s: Sample): string[] {
  const p: string[] = [];
  if (!s.title?.trim()) p.push("missing `title`");
  if (!s.question?.trim()) p.push("missing `question`");
  if (!s.essay?.trim()) p.push("missing `essay`");
  if (s.image && !existsSync(join(samplesDir(taskId), s.image))) p.push(`image file ${s.image} not found next to it`);
  if (s.teacherBands) {
    for (const c of CRITERIA) {
      const b = s.teacherBands[c];
      if (typeof b !== "number" || !Number.isInteger(b) || b < 0 || b > 9) p.push(`teacherBands.${c} must be a whole number 0–9`);
    }
  }
  return p;
}

export function readSampleImage(taskId: string, file: string): { bytes: Buffer; contentType: string } {
  if (!SAFE.test(file)) throw new Error(`Bad file name: ${file}`);
  const bytes = readFileSync(join(samplesDir(taskId), file));
  const ext = file.split(".").pop()?.toLowerCase();
  const contentType = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/webp";
  return { bytes, contentType };
}

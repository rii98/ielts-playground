import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { mark } from "../core/run.ts";
import { loadSample } from "../core/samples.ts";
import { RUNS_DIR, TASKS_DIR } from "../core/paths.ts";
import { CRITERIA } from "../core/types.ts";

/**
 * `npm run mark -- <task> <sample> [--save-example]`
 * Marks one sample essay and prints the bands. The full result is saved in runs/.
 * --save-example also writes it as the task's example-output.json (used by
 * "Preview example" and by `npm run check`).
 */
const [taskId, sampleId] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const saveExample = process.argv.includes("--save-example");
if (!taskId || !sampleId) {
  console.error("Usage: npm run mark -- <task> <sample> [--save-example]");
  process.exit(1);
}

const sample = loadSample(taskId, sampleId);
console.log(`Marking ${taskId} / ${sample.title} …`);
const result = await mark({ taskId, sampleId, question: sample.question, essay: sample.essay, data: sample.data });

mkdirSync(join(RUNS_DIR, taskId), { recursive: true });
const file = join(RUNS_DIR, taskId, `${new Date().toISOString().replace(/[:.]/g, "-")}-${sampleId}.json`);
writeFileSync(file, JSON.stringify(result, null, 2));

if (!result.ok) {
  console.error(`✗ Failed at ${result.stage}: ${result.error}`);
  console.error(`  Details saved to ${file}`);
  process.exit(1);
}

console.log(`✓ ${(result.latencyMs / 1000).toFixed(1)}s · overall ${result.overall}`);
for (const c of CRITERIA) {
  const t = sample.teacherBands?.[c];
  console.log(`  ${c.padEnd(28)} AI ${result.bands[c]}${t === undefined ? "" : `   teacher ${t}`}`);
}
if (result.droppedQuotes.length) console.log(`  (dropped ${result.droppedQuotes.length} quote(s) not found in the essay)`);
console.log(`Saved to ${file}`);

if (saveExample) {
  writeFileSync(join(TASKS_DIR, taskId, "example-output.json"), JSON.stringify({ sampleId, output: result.raw }, null, 2) + "\n");
  console.log(`Wrote tasks/${taskId}/example-output.json`);
}

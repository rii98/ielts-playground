import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REPORTS_DIR } from "../core/paths.ts";

/**
 * `npm run compare -- <task> [older.json newer.json]`
 * Before/after of two eval reports (default: the latest two for the task).
 */
const [taskId, a, b] = process.argv.slice(2);
if (!taskId) {
  console.error("Usage: npm run compare -- <task> [older.json newer.json]");
  process.exit(1);
}
const dir = join(REPORTS_DIR, taskId);
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).sort() : [];
const [oldF, newF] = a && b ? [a, b] : files.slice(-2);
if (!oldF || !newF) {
  console.error(`Need two reports in reports/${taskId}/ — run \`npm run eval -- ${taskId}\` before and after a change.`);
  process.exit(1);
}

type Report = {
  when: string;
  git: { commit: string; dirty: boolean; message: string };
  summary: { perCriterion: Record<string, { exact: number; within1: number; mae: number; bias: number; n: number }>; failures: number };
  samples: { id: string; title: string; teacherBands: Record<string, number> | null; runs: { ok: boolean; overall?: number; bands?: Record<string, number> }[] }[];
};
const load = (f: string) => JSON.parse(readFileSync(f.includes("/") ? f : join(dir, f), "utf8")) as Report;
const A = load(oldF);
const B = load(newF);

console.log(`BEFORE  ${oldF}  (${A.git.commit}${A.git.dirty ? ", uncommitted changes" : ""}: ${A.git.message})`);
console.log(`AFTER   ${newF}  (${B.git.commit}${B.git.dirty ? ", uncommitted changes" : ""}: ${B.git.message})\n`);

const keys = [...new Set([...Object.keys(A.summary.perCriterion), ...Object.keys(B.summary.perCriterion)])];
if (keys.length) {
  console.log("Criterion                     exact (before → after)   avg diff (before → after)   bias");
  for (const k of keys) {
    const x = A.summary.perCriterion[k];
    const y = B.summary.perCriterion[k];
    const ex = `${x ? `${x.exact}/${x.n}` : "–"} → ${y ? `${y.exact}/${y.n}` : "–"}`;
    const mae = `${x?.mae ?? "–"} → ${y?.mae ?? "–"}`;
    const bias = `${x?.bias ?? "–"} → ${y?.bias ?? "–"}`;
    console.log(`${k.padEnd(30)}${ex.padEnd(25)}${mae.padEnd(28)}${bias}`);
  }
}
console.log(`\nFailed runs: ${A.summary.failures} → ${B.summary.failures}\n`);

console.log("Per essay (first run overall):");
for (const s of B.samples) {
  const before = A.samples.find((x) => x.id === s.id)?.runs.find((r) => r.ok)?.overall;
  const after = s.runs.find((r) => r.ok)?.overall;
  const t = s.teacherBands
    ? Math.round((Object.values(s.teacherBands).reduce((p, q) => p + q, 0) / 4) * 2) / 2
    : undefined;
  console.log(`  ${s.title.padEnd(40)} ${before ?? "–"} → ${after ?? "–"}${t === undefined ? "" : `   (teacher ${t})`}`);
}

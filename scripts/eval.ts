import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { mark } from "../core/run.ts";
import { listSamples } from "../core/samples.ts";
import { REPORTS_DIR } from "../core/paths.ts";
import { overallBand } from "../core/contract.ts";
import { CRITERIA, type Criterion, type MarkResult } from "../core/types.ts";
import { getTask } from "../core/run.ts";

/**
 * `npm run eval -- <task> [--repeat 3] [--only id1,id2]`
 *
 * Marks every sample that has teacher bands (or every sample, if none do) and
 * compares the AI with the teacher. `--repeat` runs each essay several times to
 * measure consistency. The report is saved in reports/<task>/ — commit it so
 * `npm run compare` can show before/after.
 */
const args = process.argv.slice(2);
const taskId = args[0]?.startsWith("--") ? undefined : args[0];
const repeat = Number(flag("--repeat") ?? 1);
const only = flag("--only")?.split(",");
if (!taskId) {
  console.error("Usage: npm run eval -- <task> [--repeat 3] [--only id1,id2]");
  process.exit(1);
}
getTask(taskId);

function flag(name: string): string | undefined {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

let samples = listSamples(taskId);
if (only) samples = samples.filter((s) => only.includes(s.id));
const banded = samples.filter((s) => s.teacherBands);
const pool = banded.length ? banded : samples;
if (!pool.length) {
  console.error(`No samples in tasks/${taskId}/samples/.`);
  process.exit(1);
}
if (!banded.length) console.log("No samples have teacher bands yet — measuring consistency only.\n");

interface RunRecord {
  ok: boolean;
  bands?: Record<Criterion, number>;
  overall?: number;
  error?: string;
  latencyMs: number;
  output?: unknown;
}
const results: { id: string; title: string; teacherBands: Record<Criterion, number> | null; runs: RunRecord[] }[] = [];

let n = 0;
const total = pool.length * repeat;
for (const s of pool) {
  const runs: RunRecord[] = [];
  for (let r = 0; r < repeat; r++) {
    n++;
    process.stdout.write(`[${n}/${total}] ${s.title}${repeat > 1 ? ` (run ${r + 1})` : ""} … `);
    const res: MarkResult = await mark({ taskId, sampleId: s.id, question: s.question, essay: s.essay, data: s.data });
    if (res.ok) {
      console.log(`overall ${res.overall}  (${(res.latencyMs / 1000).toFixed(0)}s)`);
      runs.push({ ok: true, bands: res.bands, overall: res.overall, latencyMs: res.latencyMs, output: res.output });
    } else {
      console.log(`FAILED at ${res.stage}: ${res.error}`);
      runs.push({ ok: false, error: `${res.stage}: ${res.error}`, latencyMs: res.latencyMs });
    }
  }
  results.push({ id: s.id, title: s.title, teacherBands: s.teacherBands ?? null, runs });
}

// ---- summary ----
const okRuns = results.flatMap((r) => r.runs.filter((x) => x.ok).map((x) => ({ s: r, x })));
const failures = results.reduce((k, r) => k + r.runs.filter((x) => !x.ok).length, 0);

const perCriterion: Record<string, { exact: number; within1: number; mae: number; bias: number; n: number }> = {};
for (const c of [...CRITERIA, "overall"] as const) {
  const diffs = okRuns
    .filter(({ s }) => s.teacherBands)
    .map(({ s, x }) =>
      c === "overall" ? x.overall! - overallBand(s.teacherBands!) : x.bands![c] - s.teacherBands![c],
    );
  if (!diffs.length) continue;
  const tol = c === "overall" ? 0.5 : 0;
  perCriterion[c] = {
    n: diffs.length,
    exact: diffs.filter((d) => Math.abs(d) <= tol).length,
    within1: diffs.filter((d) => Math.abs(d) <= 1).length,
    mae: round(diffs.reduce((a, d) => a + Math.abs(d), 0) / diffs.length),
    bias: round(diffs.reduce((a, d) => a + d, 0) / diffs.length),
  };
}

const consistency =
  repeat > 1
    ? results.map((r) => {
        const ok = r.runs.filter((x) => x.ok);
        const spread = Math.max(...CRITERIA.map((c) => range(ok.map((x) => x.bands![c]))), 0);
        return { id: r.id, identical: ok.length > 1 && spread === 0, maxSpread: spread, overallSpread: range(ok.map((x) => x.overall!)) };
      })
    : undefined;

const git = gitInfo();
const report = {
  task: taskId,
  when: new Date().toISOString(),
  git,
  model: getTask(taskId).model ?? process.env.OLLAMA_MODEL ?? "gemma4:31b-cloud",
  repeat,
  summary: { samples: results.length, runs: total, failures, perCriterion, consistency },
  samples: results,
};

mkdirSync(join(REPORTS_DIR, taskId), { recursive: true });
const file = join(REPORTS_DIR, taskId, `${report.when.slice(0, 16).replace(/[:T]/g, "-")}-${git.commit}${git.dirty ? "-dirty" : ""}.json`);
writeFileSync(file, JSON.stringify(report, null, 2) + "\n");

// ---- print ----
console.log("");
if (Object.keys(perCriterion).length) {
  console.log("Criterion                     exact   within 1   avg diff   bias (+ = AI too generous)");
  for (const [c, m] of Object.entries(perCriterion)) {
    const label = c === "overall" ? "overall (±0.5 counts as exact)" : c;
    console.log(
      `${label.padEnd(30)}${`${m.exact}/${m.n}`.padEnd(8)}${`${m.within1}/${m.n}`.padEnd(11)}${String(m.mae).padEnd(11)}${m.bias > 0 ? "+" : ""}${m.bias}`,
    );
  }
}
if (consistency) {
  const same = consistency.filter((c) => c.identical).length;
  console.log(`\nConsistency: ${same}/${consistency.length} essays got identical bands on every run.`);
  for (const c of consistency.filter((x) => !x.identical)) console.log(`  ${c.id}: bands moved by up to ${c.maxSpread}, overall by ${c.overallSpread}`);
}
if (failures) console.log(`\n${failures} run(s) failed — see the report for details.`);
console.log(`\nReport: ${file}`);

function round(x: number) {
  return Math.round(x * 100) / 100;
}
function range(xs: number[]) {
  return xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
}
function gitInfo(): { commit: string; dirty: boolean; message: string } {
  try {
    const commit = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    const dirty = execSync("git status --porcelain -- tasks components", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() !== "";
    const message = execSync("git log -1 --pretty=%s", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    return { commit, dirty, message };
  } catch {
    return { commit: "nogit", dirty: true, message: "" };
  }
}

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { TASKS } from "../tasks/index.ts";
import { SCREENS } from "../tasks/screens.ts";
import { example } from "../core/api.ts";
import { jsonSchemaOf, countWords } from "../core/prompt.ts";
import { listSamples, sampleProblems } from "../core/samples.ts";
import { settings } from "../core/ollama.ts";
import { TASKS_DIR } from "../core/paths.ts";

/**
 * `npm run check` — run after EVERY change. No model calls, takes seconds.
 * Proves, for each task, that prompt + schema + samples + example output +
 * Feedback screen all still fit together. Plain-language messages; exits 1 on any ✗.
 */

let failed = 0;
const bad = (msg: string) => {
  failed++;
  console.log(`  ✗ ${msg}`);
};
const good = (msg: string) => console.log(`  ✓ ${msg}`);
const note = (msg: string) => console.log(`  · ${msg}`);

const folders = readdirSync(TASKS_DIR).filter((f) => statSync(join(TASKS_DIR, f)).isDirectory());
for (const f of folders) {
  if (!TASKS[f]) bad(`tasks/${f}/ exists but is not registered in tasks/index.ts`);
  if (!SCREENS[f]) bad(`tasks/${f}/ has no screen registered in tasks/screens.ts`);
}

for (const task of Object.values(TASKS)) {
  console.log(`\n${task.label}  (tasks/${task.id})`);

  try {
    jsonSchemaOf(task.schema);
    good("schema.ts converts to a JSON Schema");
  } catch (err) {
    bad(`schema.ts: ${(err as Error).message}`);
  }

  const samples = listSamples(task.id);
  if (!samples.length) bad("no sample essays in samples/");
  const banded = samples.filter((s) => s.teacherBands).length;
  let samplesOk = true;
  for (const s of samples) {
    for (const p of sampleProblems(task.id, s)) {
      samplesOk = false;
      bad(`samples/${s.id}.json: ${p}`);
    }
    if (task.needsImage && !s.image) {
      samplesOk = false;
      bad(`samples/${s.id}.json: this task needs an \`image\``);
    }
    try {
      const p = task.buildPrompt({ question: s.question, essay: s.essay, wordCount: countWords(s.essay), data: s.data, hasImage: !!s.image });
      if (/\{\{[A-Z0-9_]+\}\}/.test(p.system + p.user)) {
        samplesOk = false;
        bad(`prompt for ${s.id} still contains a {{PLACEHOLDER}}`);
      }
    } catch (err) {
      samplesOk = false;
      bad(`prompt does not build for ${s.id}: ${(err as Error).message}`);
    }
  }
  if (samplesOk && samples.length) good(`${samples.length} samples load and the prompt builds for each (${banded} with teacher bands)`);

  if (!existsSync(join(TASKS_DIR, task.id, "example-output.json"))) {
    bad("example-output.json missing — run `npm run mark -- " + task.id + " <sample> --save-example`");
    continue;
  }
  const ex = example(task.id);
  if ("error" in ex) {
    bad(`example-output.json: ${ex.error}`);
    continue;
  }
  if (!ex.result.ok) continue;
  good(`example-output.json matches schema.ts and the locked core fields (overall ${ex.result.overall})`);
  if (ex.result.droppedQuotes.length) note(`example has ${ex.result.droppedQuotes.length} quote(s) not found in its essay (they are dropped)`);

  const Screen = SCREENS[task.id];
  const sample = samples.find((s) => s.id === ex.sampleId);
  if (Screen && sample) {
    try {
      const html = renderToString(createElement(Screen, { result: ex.result, essay: sample.essay, question: sample.question }));
      if (html.length < 50) bad("Feedback.tsx rendered almost nothing for the example output");
      else good("Feedback.tsx renders the example output");
    } catch (err) {
      bad(`Feedback.tsx crashes on the example output: ${(err as Error).message}`);
    }
  }
}

console.log("");
if (!settings().key) console.log("· No Ollama key in .env yet — checks pass without it, but Run marking won't work. (/setup)");
if (failed) {
  console.log(`✗ ${failed} problem(s).`);
  process.exit(1);
}
console.log("✓ All good.");

# IELTS Writing Playground — instructions for Claude

## Who you are working with

The person talking to you is an **IELTS teacher, not a developer**. They use this
playground to tune how AI marks IELTS Writing (Task 1 Academic, Task 1 General
Training, Task 2): the marking prompt, the shape of the AI's output, and the
feedback screen students will see. When they are happy, a developer copies the
finished task into the real app.

How to talk to them:

- Plain English. No jargon (say "the feedback screen", not "the component"; "the
  output fields", not "the Zod schema"). Don't paste code unless they ask.
- Before a change, say in 1–3 lines what you will change. For a small, clear request
  just do it; for anything that changes HOW bands are decided, or removes something
  students currently see, confirm first.
- After a change, say what changed, what the test showed, and what to look at in the
  browser.
- They know IELTS far better than you do. When they say a band is wrong, believe the
  band and work out why the prompt produced a different one.

## What is where

```
tasks/<task>/            one folder per task: task2, task1-academic, task1-general
  system.md              the examiner brief (the main prompt). {{RUBRIC}} {{OUTPUT_SCHEMA}} are filled in by code
  user.md                the per-essay message: word count, question, essay
  rubric.md              the band descriptors, pasted into {{RUBRIC}}
  schema.ts              the output fields the AI must return (also sent to Ollama to force that shape)
  Feedback.tsx           the feedback screen, built from those fields
  task.ts                wires the files above together (placeholders, word minimum)
  example-output.json    one saved AI answer, used by "Preview example" and `npm run check`
  samples/*.json         essays: title, question, essay, (image, data), teacherBands
tasks/index.ts, tasks/screens.ts   the list of tasks (server side / screen side)
tasks/length-note.ts     the under-word-count note added to every task's user message
components/              building blocks for feedback screens (BandBadge, CriterionCard, HighlightedEssay…)
app/                     the playground page itself; app/styles.css holds all styling
core/                    LOCKED engine: model call, JSON parsing, quote finding, band maths
scripts/                 check / mark / eval / compare / ping
reports/<task>/          saved test results (commit them, so before/after can be compared)
```

How a run works: `task.ts` builds the prompt from the .md files → the model (Ollama,
`gemma4:31b-cloud`) answers in the exact shape of `schema.ts` → code checks it, finds
every `quote` in the essay, and calculates the overall band → `Feedback.tsx` draws it.

## Rules (do not break these)

1. **Never edit `core/`.** It matches the real app. If a request truly needs a core
   change, explain why to the teacher and tell them to ask the developer.
2. **Locked output fields.** Every task's `schema.ts` must keep
   `criteria: [{ criterion, band, ... }] × 4`, using exactly the ids
   `task_achievement`, `coherence_cohesion`, `lexical_resource`,
   `grammatical_range_accuracy`, each `band` a whole number 0–9. The app stores and
   charts these. Everything else in the schema can be added, renamed or removed.
3. **The model never gives the overall band.** Code computes it (mean of the four,
   rounded to the nearest half band). Don't ask for it in the prompt or the schema.
4. **The model never gives positions in the text.** To point at words in the essay,
   use a field named `quote` holding the exact words. Code adds `start`/`end` and
   drops quotes that aren't really in the essay. `HighlightedEssay` uses them.
5. **Keep the three in step.** When you change `schema.ts`, also update
   `Feedback.tsx` (show the new field / stop reading a removed one) and
   `example-output.json` (refresh it: `npm run mark -- <task> <sample> --save-example`,
   or edit it by hand if the model can't be called). Prompt text that describes
   the output must match the schema too.
6. **After every change run `npm run check`** and fix anything it reports before you
   say you're done. It costs nothing (no model calls).
7. **After a change to `system.md`, `user.md`, `rubric.md` or `schema.ts`**, run
   `npm run eval -- <task>` (it marks the sample essays; ~5–10 s each) and then
   `npm run compare -- <task>` and report the before/after in plain words. If there
   is no earlier report, run eval once BEFORE making the change, so there is a
   "before". Commit the new report with the change.
8. **One experiment = one commit.** Commit with a message a teacher can read, e.g.
   `task2: Coherence feedback now quotes the weak linking word`. Never push, force
   or rewrite history unless the teacher asks; use `git revert` to undo.
9. **Never read, print or edit `.env`** — it holds the teacher's Ollama key. To check
   the key works, run `npm run ping`.
10. **Band descriptors stay in our own words.** `rubric.md` paraphrases the public
    IELTS descriptors; do not paste official or copyrighted text in verbatim.
11. **Don't run the model in loops.** Eval runs each essay once by default; only use
    `--repeat 3` when the teacher asks about consistency (it triples the calls).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | starts the playground at http://localhost:5199 (run it in the background and leave it running) |
| `npm run check` | checks every task fits together — after EVERY change |
| `npm run ping` | checks the Ollama key works |
| `npm run mark -- <task> <sample> [--save-example]` | marks one sample, prints the bands |
| `npm run eval -- <task> [--repeat 3] [--only a,b]` | marks the samples, compares with teacherBands, saves a report |
| `npm run compare -- <task>` | before/after of the latest two reports |

Task ids: `task2`, `task1-academic`, `task1-general`. Sample ids are the file names
in `tasks/<task>/samples/` without `.json`.

## Common requests and how to do them

- **"The AI is too generous / too harsh on X"** → look at the eval report's bias for
  that criterion and at the AI's `evidence` for the essays it got wrong. Adjust the
  boundary questions or descriptors in `system.md` / `rubric.md` for that criterion.
  Change one thing at a time, then eval + compare.
- **"Add a new piece of feedback"** (e.g. a vocabulary upgrade list) → add the field
  to `schema.ts` with a clear name, describe it in `system.md` (what, how many, tone),
  show it in `Feedback.tsx` (reuse `components/`, or add a new one there), refresh
  `example-output.json`, check.
- **"Change how the screen looks"** → `Feedback.tsx` for what appears and in what
  order; `app/styles.css` for colours, sizes and spacing. Use "Preview example" in the
  browser to see it without calling the model. No eval needed for screen-only changes.
- **"Add this essay"** → create `tasks/<task>/samples/<short-name>.json` with `title`,
  `question`, `essay`, and `teacherBands` (`{ "task_achievement": 6, "coherence_cohesion": 6,
  "lexical_resource": 6, "grammatical_range_accuracy": 5 }`) if they give bands. For
  Academic Task 1 also `image` (a file saved next to it) and optionally `data` (the
  chart's figures as text). Use `/add-essay`.
- **"Go back"** → `git log --oneline` to find the experiment, `git revert <commit>`.
- **New task** (e.g. a separate Task 2 prompt for one question type) → copy a task
  folder, change `id`/`label` in its `task.ts`, register it in `tasks/index.ts` and
  `tasks/screens.ts`, check.

## Handing over to the app

When the teacher says a task is ready, use `/ready`. The developer will take, from
`tasks/<task>/`: `system.md`, `user.md`, `rubric.md` (the prompt), `schema.ts` (the
output contract) and `Feedback.tsx` + any `components/` it uses (the screen).

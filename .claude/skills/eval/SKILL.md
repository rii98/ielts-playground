---
name: eval
description: Test a task's current marking against the sample essays and explain the results. Use when the teacher asks "how accurate is it", "test it", or "how consistent is it".
argument-hint: <task> [--repeat 3]
---

Run `npm run eval -- $ARGUMENTS`. Then explain the result plainly:

- For each criterion: how often the AI matched the teacher exactly, how often within
  one band, and the bias ("the AI tends to give Grammar about half a band MORE than you").
- Point out the essay(s) where the AI was furthest from the teacher, and quote the AI's
  `evidence` for that criterion from the report so the teacher can see its reasoning.
- If `--repeat` was used: whether the bands were the same on every run.
- If no essays have teacher bands, say so and suggest /add-essay.

Commit the new report file: `eval(<task>): <one-line summary>`.

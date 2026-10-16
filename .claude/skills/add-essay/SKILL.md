---
name: add-essay
description: Add a student essay (with the teacher's bands) to a task's test set.
argument-hint: [task]
---

Help the teacher add an essay to the test set for: $ARGUMENTS

1. Ask (in one message) for anything not given yet: which task; the question exactly
   as the student saw it; the essay; their four bands (TA/TR, CC, LR, GRA — whole
   numbers); for Academic Task 1, the chart image (they can drag it into the chat or
   tell you the file's location) and, optionally, the chart's figures.
2. Create `tasks/<task>/samples/<short-kebab-name>.json`:
   `{ "title", "question", "essay", "teacherBands": { "task_achievement", "coherence_cohesion",
   "lexical_resource", "grammatical_range_accuracy" }, "notes" }` — plus `"image"`
   (copy the image file into the same folder) and `"data"` for Academic Task 1.
   Keep the essay text exactly as written, mistakes included.
3. `npm run check`, then commit `samples(<task>): add <title>`.
4. Offer to mark it now (`npm run mark -- <task> <name>`) and show AI vs teacher bands.

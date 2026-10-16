---
name: tune
description: Make one change to how a task is marked or shown (prompt, output fields, or feedback screen), test it, and report before/after. Use for any "change the AI / the feedback / the screen" request.
argument-hint: <task> <what to change>
---

The teacher wants this change: $ARGUMENTS

Follow CLAUDE.md. Steps:

1. Work out which task (task2, task1-academic, task1-general — ask if unclear) and
   which kind of change it is:
   - **Marking** (how bands or feedback are decided) → `system.md` / `rubric.md` / `user.md`
   - **Output** (a new/changed/removed piece of feedback) → `schema.ts` + `system.md` + `Feedback.tsx` + `example-output.json`
   - **Screen only** (layout, order, wording of labels, colours) → `Feedback.tsx` / `components/` / `app/styles.css`
2. Say in 1–3 plain lines what you'll change. If it changes how bands are decided or
   removes something students see, wait for an OK.
3. For marking/output changes: if `reports/<task>/` has no report for the current
   version, run `npm run eval -- <task>` first to get a "before".
4. Make the change — the smallest edit that does it.
5. Run `npm run check` and fix anything it reports.
6. For marking/output changes: `npm run eval -- <task>` then `npm run compare -- <task>`.
   Report in plain words: which bands moved, whether they moved toward the teacher's
   bands, anything that got worse. If no samples have teacher bands, say the test only
   shows what the AI now gives, and suggest /add-essay.
7. Commit (including the new report) with a teacher-readable message,
   e.g. `task2: stricter on collocation errors in Lexical Resource`.
8. Tell them what to look at: "Refresh the page and press Run marking on <essay>" or,
   for screen changes, "press Preview example".

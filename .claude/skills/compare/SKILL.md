---
name: compare
description: Compare the latest two test reports of a task (before vs after a change) and explain what improved or got worse.
argument-hint: <task>
---

Run `npm run compare -- $ARGUMENTS`. Use `git log --oneline -5` to name what changed
between the two reports. Explain in plain words: what got closer to the teacher's
bands, what moved away, and whether the change is worth keeping. If it made things
worse, offer /undo.

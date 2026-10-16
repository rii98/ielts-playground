---
name: ready
description: Mark a task as ready to bring into the real app — final check, test, handover notes, and a tag.
argument-hint: <task>
---

The teacher says this task is ready: $ARGUMENTS

1. `npm run check` — must pass.
2. `npm run eval -- <task>` and summarise the accuracy in two lines.
3. Update `HANDOFF.md` (create it if missing) with a section for this task, newest
   first, dated today:
   - What changed since the original (read `git log --oneline -- tasks/<task>` and
     summarise in teacher language, 3–8 bullets)
   - Output fields added/removed vs the first commit (`git diff <first-commit> -- tasks/<task>/schema.ts`)
   - Any new components in `components/`
   - The latest accuracy numbers
4. Commit `ready(<task>): <summary>` and tag it `ready-<task>-<YYYY-MM-DD>`.
5. Make the file the developer needs: if a GitHub remote exists (`git remote -v`), ASK
   the teacher before pushing; if they agree, `git push && git push --tags`. Otherwise
   run `git bundle create ~/Desktop/ielts-playground-<task>-<YYYY-MM-DD>.bundle --all`
   (it carries every change and its history).
6. Tell the teacher: send that file (or the tag name, if pushed) to the developer.

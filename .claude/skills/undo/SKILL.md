---
name: undo
description: Undo the last experiment (or a named one) safely with git revert.
argument-hint: [what to undo]
---

The teacher wants to undo: $ARGUMENTS (if empty: the most recent experiment).

1. Run `git log --oneline -10` and pick the commit. Tell the teacher which one in plain
   words ("the change from 20 minutes ago that made Grammar stricter") and wait for OK.
2. If there are uncommitted changes, ask whether to keep them first.
3. `git revert --no-edit <commit>`, then `npm run check`.
4. Tell them it's undone and that the history is kept, so it can be re-done later.
Never use `git reset --hard`.

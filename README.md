# ielts-playground

A standalone playground for tuning IELTS Writing marking (Task 1 Academic, Task 1 GT,
Task 2): prompt → output schema → feedback screen → test against teacher bands.
Designed to be driven by the teacher through Claude Code (see `TEACHER.md`, `CLAUDE.md`,
and the slash commands in `.claude/skills/`).

v1 of every task is the live app's marker as of 2026-10-16 (prompt `2026-09-30.studio.1`,
descriptors `2026-09-30`), minus the question-type checklist (`taskChecklist`), which
needs the app's question-type data.

```bash
npm install
cp .env.example .env   # add OLLAMA_API_KEY
npm run dev            # http://localhost:5199
npm run check          # prompt + schema + samples + example + screen fit together
npm run eval -- task2  # mark samples vs teacher bands → reports/task2/
```

## Bringing a task back into the app

| Playground | App |
|---|---|
| `tasks/<t>/system.md` + `rubric.md` | `SYSTEM_TEMPLATE` + task framing in `server/marking/prompt.ts`, descriptors in `server/marking/rubric/descriptors.ts` |
| `tasks/<t>/user.md`, `tasks/length-note.ts` | `userPrompt()` in `server/marking/prompt.ts` |
| `tasks/<t>/schema.ts` | `modelOutputSchema` / `criterionEvaluation` in `server/marking/output-schema.ts` + `provider.ts` |
| `tasks/<t>/Feedback.tsx` + `components/` | the writing evaluation view in the client |
| `core/ground.ts`, `core/contract.ts` | `server/marking/grounding.ts`, `withComputedOverall`, `roundIeltsBand` (same rules) |

The locked core (`criteria` × 4 with whole-number bands; the overall band computed in code;
quotes rather than offsets) is what makes a finished task drop in without breaking stored
evaluations or progress. `HANDOFF.md` (written by `/ready`) lists what changed.

The teacher downloads the repo as a ZIP; `/setup` starts a local git history and `/ready`
writes `~/Desktop/ielts-playground-<task>-<date>.bundle`. To pull their work:
`git fetch /path/to/file.bundle 'refs/heads/*:refs/remotes/teacher/*' --tags`
(their history starts with its own root commit, so diff `tasks/` against yours rather than merging).

---
name: setup
description: First-time setup of the playground on this Mac — checks Node, installs, asks for the Ollama key, starts the preview. Use when the teacher says "set up", "install", "it doesn't start", or the key is missing.
---

Set up the playground for the teacher, one step at a time, explaining each in a short
plain sentence. Stop and help if a step fails.

1. Run `node -v`. If Node is missing or older than v20.12, tell the teacher to install
   the **LTS** version from https://nodejs.org (download the macOS installer, open it,
   click through), then come back and say "done". Wait.
2. Run `npm install`.
   If the folder has no git history yet (`git status` fails — it was downloaded as a
   ZIP), run `git init && git add -A && git commit -m "start: playground as received"`.
   This is what makes /undo and before/after comparisons work. (If macOS asks to
   install "command line developer tools", tell the teacher to click Install, wait,
   then continue.)
3. If there is no `.env` file: run `cp .env.example .env` then `open -e .env`. Tell the
   teacher: "A text file opened. Paste your Ollama key right after `OLLAMA_API_KEY=`
   (no spaces), save with ⌘S, close it, and tell me when done." Wait.
   Never read, print or edit `.env` yourself.
4. Run `npm run ping`. If it fails, explain the message plainly (most often: key pasted
   with a space, or not saved) and go back to step 3.
5. Run `npm run check`.
6. Start `npm run dev` in the background (leave it running). Tell the teacher the
   playground is open at http://localhost:5199 (it usually opens by itself) and how to
   use it: pick a task at the top, pick an essay, press **Run marking**; **Preview
   example** shows the screen without calling the AI.
7. Finish with 3 example things they can ask you, e.g.
   - "/tune task2 The AI gives Lexical Resource 7 too easily — be stricter about collocation errors"
   - "/add-essay" (to add their own banded essays)
   - "Make the overall band bigger and put the essay highlights first"

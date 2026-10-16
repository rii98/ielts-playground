# IELTS Writing Playground: teacher guide

Use this to change how the AI marks IELTS Writing and how the feedback looks, then
test it on real essays. You never edit code. You tell Claude what you want.

## One-time setup (about 10 minutes)

1. **Install Claude** (the desktop app) from https://claude.ai/download and sign in.
2. **Get this folder.** On the GitHub page you were sent, click the green **Code** button →
   **Download ZIP**. Double-click the zip to unzip it and move the folder into **Documents**
   (rename it `ielts-playground` if it's called `ielts-playground-main`).
3. **Open the folder in Claude Code** (Code tab → open folder → `ielts-playground`).
4. Type **`/setup`** and press Enter. Claude will check your Mac, install what's needed,
   and open a small text file where you paste the Ollama key you were given.
5. When it's done, the playground opens in your browser at **http://localhost:5199**.

Next time, open the folder in Claude and say **"start the playground"**.

## Using the playground (in the browser)

- Pick a task at the top: **Task 2 · Essay**, **Task 1 · Academic chart** or **Task 1 · GT letter**.
- Pick an essay on the left (or *Paste my own…*), then press **Run marking** (about 5–10 seconds).
- Tabs on the right:
  - **Feedback**: what the student would see.
  - **Teacher vs AI**: your bands next to the AI's (for essays you have banded).
  - **Output JSON**: the AI's raw answer.
  - **Prompt sent**: exactly what the AI was told.
- **Preview example** shows the feedback screen instantly, without calling the AI. Use it
  when you're only changing how things look.

## Asking Claude for changes

Just describe it. Some examples:

| You want… | Say… |
|---|---|
| Stricter or more lenient marking | `/tune task2 Lexical Resource 7 is given too easily, be stricter about wrong collocations` |
| A new piece of feedback | `/tune task2 Add a "vocabulary upgrades" list: 3 words the student used, each with a better alternative` |
| A different screen | `Put the highlighted essay first and make the overall band bigger` |
| Feedback in a different tone | `/tune task1-general Feedback should speak directly to the student ("you"), shorter sentences` |
| Add your own banded essays | `/add-essay task2` (then paste the question, essay and your four bands) |
| See how accurate it is | `/eval task2` |
| Is it consistent? | `/eval task2 --repeat 3` |
| Before vs after | `/compare task2` |
| Undo the last change | `/undo` |
| Finished, send it to the app | `/ready task2` (Claude makes one file for you to send to the developer) |

Tips:

- **Change one thing at a time.** Then you can tell what helped.
- **Band essays yourself.** The test is only as good as your banded essays. Aim for
  10+ per task, across bands 4–8.
- Claude saves every change, so nothing is lost. `/undo` always works.
- When Claude asks to run something, it's safe to click **Allow** for the playground's
  own commands.

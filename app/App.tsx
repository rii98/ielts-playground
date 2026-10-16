import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { SCREENS } from "../tasks/screens.ts";
import { CRITERIA, type MarkResult, type Sample } from "../core/types.ts";
import { criterionLabel, formatBand } from "../components/labels.ts";
import { api, type TaskInfo } from "./api.ts";

/**
 * The playground shell: pick a task and an essay, run the marker, look at the result
 * four ways. The feedback screen itself is each task's Feedback.tsx — this file only
 * hosts it.
 */

const OWN = "__own__";

interface Draft {
  sampleId: string;
  question: string;
  essay: string;
  data: string;
  imageBase64?: string;
}

/** What was marked plus the result, so the screen always shows the essay it marked. */
interface Shown {
  result: MarkResult;
  essay: string;
  question: string;
  sampleId?: string;
}

const store = {
  get<T>(key: string): T | undefined {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : undefined;
    } catch {
      return undefined;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked — the page works without it */
    }
  },
};

type Tab = "feedback" | "compare" | "json" | "prompt";

export function App() {
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [taskId, setTaskId] = useState<string>(() => store.get<string>("task") ?? "task2");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [draft, setDraft] = useState<Draft>({ sampleId: OWN, question: "", essay: "", data: "" });
  const [shown, setShown] = useState<Shown | undefined>();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string>();
  const [tab, setTab] = useState<Tab>("feedback");
  /** Which task the current draft belongs to — so a draft is never saved under the wrong task while switching. */
  const draftTask = useRef<string>("");

  const task = tasks.find((t) => t.id === taskId);

  useEffect(() => {
    api.tasks().then(setTasks).catch((e: Error) => setError(e.message));
  }, []);

  // Switching task: load its samples, restore its last draft and result.
  useEffect(() => {
    store.set("task", taskId);
    draftTask.current = "";
    setError(undefined);
    setShown(store.get<Shown>(`shown:${taskId}`));
    api
      .samples(taskId)
      .then((list) => {
        setSamples(list);
        const saved = store.get<Draft>(`draft:${taskId}`);
        if (saved?.essay.trim()) setDraft(saved);
        else if (list[0]) setDraft(fromSample(list[0]));
        else setDraft({ sampleId: OWN, question: "", essay: "", data: "" });
        draftTask.current = taskId;
      })
      .catch((e: Error) => setError(e.message));
  }, [taskId]);

  useEffect(() => {
    if (draftTask.current === taskId) store.set(`draft:${taskId}`, draft);
  }, [taskId, draft]);

  useEffect(() => {
    if (!running) return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(id);
  }, [running]);

  function show(next: Shown) {
    setShown(next);
    store.set(`shown:${taskId}`, next);
  }

  async function run() {
    setRunning(true);
    setElapsed(0);
    setError(undefined);
    try {
      const result = await api.mark({
        taskId,
        question: draft.question,
        essay: draft.essay,
        data: draft.data || undefined,
        imageBase64: draft.imageBase64,
        sampleId: draft.sampleId === OWN ? undefined : draft.sampleId,
      });
      show({ result, essay: draft.essay, question: draft.question, sampleId: draft.sampleId === OWN ? undefined : draft.sampleId });
      setTab("feedback");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function preview() {
    setError(undefined);
    const ex = await api.example(taskId);
    if ("error" in ex) return setError(ex.error);
    const sample = samples.find((s) => s.id === ex.sampleId);
    if (sample) setDraft(fromSample(sample));
    show({ result: ex.result, essay: sample?.essay ?? "", question: sample?.question ?? "", sampleId: ex.sampleId });
    setTab("feedback");
  }

  function pickSample(id: string) {
    if (id === OWN) return setDraft({ sampleId: OWN, question: "", essay: "", data: "" });
    const s = samples.find((x) => x.id === id);
    if (s) setDraft(fromSample(s));
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
    });
    setDraft({ ...draft, imageBase64: dataUrl.split(",")[1] });
  }

  const words = draft.essay.trim() ? draft.essay.trim().split(/\s+/).length : 0;
  const sample = samples.find((s) => s.id === draft.sampleId);
  const imageSrc = draft.imageBase64
    ? `data:image/*;base64,${draft.imageBase64}`
    : sample?.image
      ? api.imageUrl(taskId, sample.image)
      : undefined;
  const canRun = !running && draft.question.trim() && draft.essay.trim() && (!task?.needsImage || imageSrc);

  return (
    <div className="shell">
      <header className="topbar">
        <h1>IELTS Writing Playground</h1>
        <nav className="tasktabs">
          {tasks.map((t) => (
            <button key={t.id} className={t.id === taskId ? "on" : ""} onClick={() => setTaskId(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="layout">
        <aside className="inputs">
          <label className="field">
            <span>Essay</span>
            <select value={draft.sampleId} onChange={(e) => pickSample(e.target.value)}>
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                  {s.teacherBands ? "  ✓ banded" : ""}
                </option>
              ))}
              <option value={OWN}>✎ Paste my own…</option>
            </select>
          </label>

          <label className="field">
            <span>Question</span>
            <textarea rows={4} value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
          </label>

          {task?.needsImage && (
            <div className="field">
              <span>Chart</span>
              {imageSrc ? <img className="chart" src={imageSrc} alt="Task chart" /> : <p className="muted">No chart yet.</p>}
              <input type="file" accept="image/*" onChange={(e) => void upload(e.target.files?.[0])} />
              <details>
                <summary>Chart figures (optional, improves number checking)</summary>
                <textarea rows={4} value={draft.data} onChange={(e) => setDraft({ ...draft, data: e.target.value })} />
              </details>
            </div>
          )}

          <label className="field grow">
            <span>
              Response <em className="muted">· {words} words</em>
            </span>
            <textarea className="essay-input" value={draft.essay} onChange={(e) => setDraft({ ...draft, essay: e.target.value })} />
          </label>

          <div className="actions">
            <button className="primary" disabled={!canRun} onClick={() => void run()}>
              {running ? `Marking… ${elapsed}s` : "Run marking"}
            </button>
            <button onClick={() => void preview()} title="Show the feedback screen with saved example output — no model call">
              Preview example
            </button>
          </div>
        </aside>

        <section className="result">
          <nav className="tabs">
            {(
              [
                ["feedback", "Feedback"],
                ["compare", "Teacher vs AI"],
                ["json", "Output JSON"],
                ["prompt", "Prompt sent"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
            {shown && (
              <span className="meta">
                {shown.result.model} · {(shown.result.latencyMs / 1000).toFixed(1)}s
              </span>
            )}
          </nav>

          {error && <div className="error">{error}</div>}
          {!shown && !error && (
            <div className="empty">
              Pick an essay and press <strong>Run marking</strong>, or <strong>Preview example</strong> to see the screen
              without calling the model.
            </div>
          )}
          {shown && <ResultView shown={shown} tab={tab} taskId={taskId} samples={samples} />}
        </section>
      </main>
    </div>
  );
}

function fromSample(s: Sample): Draft {
  return { sampleId: s.id, question: s.question, essay: s.essay, data: s.data ?? "" };
}

function ResultView({ shown, tab, taskId, samples }: { shown: Shown; tab: Tab; taskId: string; samples: Sample[] }) {
  const { result } = shown;
  const Screen = SCREENS[result.taskId];
  const taskNo = taskId === "task2" ? 2 : 1;

  if (tab === "prompt")
    return (
      <div className="pane">
        {result.prompt ? (
          <>
            <h3>System</h3>
            <pre>{result.prompt.system}</pre>
            <h3>User</h3>
            <pre>{result.prompt.user}</pre>
          </>
        ) : (
          <p className="muted">No prompt was built.</p>
        )}
      </div>
    );

  if (tab === "json")
    return (
      <div className="pane">
        {result.ok && result.droppedQuotes.length > 0 && (
          <div className="warn">
            Dropped {result.droppedQuotes.length} quote(s) not found in the essay: {result.droppedQuotes.map((q) => `“${q}”`).join(", ")}
          </div>
        )}
        <pre>{JSON.stringify(result.ok ? result.output : (result.raw ?? result.content ?? null), null, 2)}</pre>
      </div>
    );

  if (!result.ok)
    return (
      <div className="pane">
        <div className="error">
          <strong>Failed at: {result.stage}</strong>
          <p>{result.error}</p>
        </div>
        {(result.raw !== undefined || result.content) && <pre>{JSON.stringify(result.raw ?? result.content, null, 2)}</pre>}
      </div>
    );

  if (tab === "compare") {
    const teacher = samples.find((s) => s.id === shown.sampleId)?.teacherBands;
    if (!teacher)
      return (
        <div className="pane muted">
          This essay has no teacher bands yet. Ask Claude: “add my bands for this essay: TA 6, CC 6, LR 7, GRA 6”.
        </div>
      );
    const teacherOverall = Math.round((CRITERIA.reduce((s, c) => s + teacher[c], 0) / 4) * 2) / 2;
    return (
      <div className="pane">
        <table className="bands">
          <thead>
            <tr>
              <th>Criterion</th>
              <th>Teacher</th>
              <th>AI</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c) => (
              <BandRow key={c} label={criterionLabel(c, taskNo)} teacher={teacher[c]} ai={result.bands[c]} />
            ))}
            <BandRow label="Overall" teacher={teacherOverall} ai={result.overall} strong />
          </tbody>
        </table>
      </div>
    );
  }

  if (!Screen) return <div className="error">No feedback screen registered for “{result.taskId}” in tasks/screens.ts.</div>;
  return (
    <div className="pane">
      <ScreenBoundary key={JSON.stringify(result.output).length}>
        <Screen result={result} essay={shown.essay} question={shown.question} />
      </ScreenBoundary>
    </div>
  );
}

function BandRow({ label, teacher, ai, strong }: { label: string; teacher: number; ai: number; strong?: boolean }) {
  const d = ai - teacher;
  const cls = Math.abs(d) <= 0.5 ? "ok" : Math.abs(d) <= 1 ? "near" : "off";
  return (
    <tr className={strong ? "strong" : ""}>
      <td>{label}</td>
      <td>{formatBand(teacher)}</td>
      <td>{formatBand(ai)}</td>
      <td className={`diff ${cls}`}>{d === 0 ? "same" : `${d > 0 ? "+" : ""}${formatBand(d)}`}</td>
    </tr>
  );
}

/** Keeps a broken Feedback.tsx from blanking the whole page. */
class ScreenBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div className="error">
          <strong>The feedback screen crashed</strong>
          <p>{this.state.error.message}</p>
          <p className="muted">Usually Feedback.tsx reads a field the output doesn't have. Ask Claude to fix it.</p>
        </div>
      );
    return this.props.children;
  }
}

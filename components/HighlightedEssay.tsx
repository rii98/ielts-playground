import { useState, type ReactNode } from "react";

export interface EssayMark {
  start: number;
  end: number;
  /** Colour group, e.g. "grammar" — styled by `.mark-<tone>` in app/styles.css. */
  tone: string;
  label: string;
  note: ReactNode;
}

/**
 * The essay with numbered highlights. Clicking a highlight (or its note) selects it.
 * Overlapping marks are skipped after the first, so the text always reads cleanly.
 */
export function HighlightedEssay({ essay, marks }: { essay: string; marks: EssayMark[] }) {
  const [active, setActive] = useState<number | null>(null);
  const sorted = [...marks].sort((a, b) => a.start - b.start);
  const kept: EssayMark[] = [];
  for (const m of sorted) if (!kept.length || m.start >= kept[kept.length - 1]!.end) kept.push(m);

  const parts: ReactNode[] = [];
  let at = 0;
  kept.forEach((m, i) => {
    if (m.start > at) parts.push(essay.slice(at, m.start));
    parts.push(
      <mark
        key={i}
        className={`mark mark-${m.tone}${active === i ? " mark-active" : ""}`}
        onClick={() => setActive(active === i ? null : i)}
      >
        {essay.slice(m.start, m.end)}
        <sup>{i + 1}</sup>
      </mark>,
    );
    at = m.end;
  });
  if (at < essay.length) parts.push(essay.slice(at));

  return (
    <div className="essay-wrap">
      <div className="essay">{parts}</div>
      {kept.length > 0 && (
        <ol className="notes">
          {kept.map((m, i) => (
            <li
              key={i}
              className={`card note${active === i ? " note-active" : ""}`}
              onClick={() => setActive(active === i ? null : i)}
            >
              <span className={`tag tag-${m.tone}`}>
                {i + 1} · {m.label}
              </span>
              <div>{m.note}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

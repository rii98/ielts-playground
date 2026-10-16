import { BandBadge } from "./BandBadge.tsx";

/** One criterion: its band, the evidence the marker quoted, and the feedback. */
export function CriterionCard({
  title,
  band,
  evidence,
  feedback,
  highlight = false,
}: {
  title: string;
  band: number;
  evidence?: string;
  feedback: string;
  highlight?: boolean;
}) {
  return (
    <article className={`card criterion${highlight ? " criterion-focus" : ""}`}>
      <header className="criterion-head">
        <BandBadge band={band} size="sm" />
        <h4>{title}</h4>
        {highlight && <span className="pill">Focus here</span>}
      </header>
      <p>{feedback}</p>
      {evidence && (
        <details className="evidence">
          <summary>Evidence</summary>
          <p>{evidence}</p>
        </details>
      )}
    </article>
  );
}

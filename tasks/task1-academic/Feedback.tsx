import {
  BandBadge,
  BulletList,
  CheckList,
  CriterionCard,
  HighlightedEssay,
  RewriteCard,
  Section,
  categoryLabel,
  criterionLabel,
} from "../../components/index.ts";
import type { FeedbackProps, Grounded } from "../../core/types.ts";
import type { schema } from "./schema.ts";

type Out = Grounded<typeof schema>;

/** The Academic Task 1 (chart) feedback screen — built only from fields in schema.ts. */
export default function Feedback({ result, essay }: FeedbackProps<Out>) {
  const o = result.output;
  const TASK = 1;

  return (
    <div className="feedback">
      <header className="hero">
        <BandBadge band={result.overall} size="lg" label="Overall" />
        <p className="headline">{o.headline}</p>
      </header>

      <Section title="Start here">
        <p>
          Your biggest gain is in <strong>{criterionLabel(o.priorityCriterion, TASK)}</strong>.
        </p>
        <BulletList items={o.nextActions} numbered />
      </Section>

      <Section title="Band by criterion">
        <div className="grid-2">
          {o.criteria.map((c) => (
            <CriterionCard
              key={c.criterion}
              title={criterionLabel(c.criterion, TASK)}
              band={c.band}
              evidence={c.evidence}
              feedback={c.feedback}
              highlight={c.criterion === o.priorityCriterion}
            />
          ))}
        </div>
      </Section>

      <Section title="In your report" hint="Click a highlight to see the note.">
        <HighlightedEssay
          essay={essay}
          marks={o.annotations.map((a) => ({
            start: a.start,
            end: a.end,
            tone: a.category,
            label: categoryLabel(a.category),
            note: (
              <>
                <p>{a.why}</p>
                <p className="suggestion">→ {a.suggestion}</p>
              </>
            ),
          }))}
        />
      </Section>

      {o.dataChecks.length > 0 && (
        <Section title="Figures to check" hint="Numbers in your report that don't match the chart.">
          <ul className="datachecks">
            {o.dataChecks.map((d, i) => (
              <li key={i} className="card">
                <q>{d.quote}</q>
                <div className="data-compare">
                  <span className="was">You wrote: {d.stated}</span>
                  <span className="is">Chart shows: {d.actual}</span>
                </div>
                <p className="muted">{d.note}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {o.modelRewrite && (
        <Section title="A stronger paragraph">
          <RewriteCard {...o.modelRewrite} />
        </Section>
      )}

      <Section title="Checks">
        <CheckList
          items={[
            { label: "Long enough", good: !o.checks.underWordCount, detail: `${result.wordCount} words (minimum 150)` },
            { label: "Describes the chart set", good: !o.checks.offTopic },
            { label: "Written for this question (not a memorised template)", good: !o.checks.memorisedTemplate },
          ]}
        />
      </Section>
    </div>
  );
}

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

/** The General Training Task 1 (letter) feedback screen — built only from fields in schema.ts. */
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

      <Section title="In your letter" hint="Click a highlight to see the note.">
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

      {o.modelRewrite && (
        <Section title="A stronger paragraph">
          <RewriteCard {...o.modelRewrite} />
        </Section>
      )}

      <Section title="Checks">
        <CheckList
          items={[
            { label: "Long enough", good: !o.checks.underWordCount, detail: `${result.wordCount} words (minimum 150)` },
            { label: "Answers the task set", good: !o.checks.offTopic },
            { label: "Written for this question (not a memorised template)", good: !o.checks.memorisedTemplate },
          ]}
        />
      </Section>
    </div>
  );
}

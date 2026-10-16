import type { ReactNode } from "react";

/** A titled block of the feedback screen. */
export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="section">
      <h3 className="section-title">{title}</h3>
      {hint && <p className="section-hint">{hint}</p>}
      {children}
    </section>
  );
}

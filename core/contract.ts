import { CRITERIA, type Criterion } from "./types.ts";

/**
 * The LOCKED core of every task's output — what the app stores, charts and builds
 * progress on. A task may add, remove or rename ANY other field, but its output must
 * always contain:
 *
 *   criteria: [ { criterion: "<one of the four ids>", band: <whole number 0–9>, ... }, ×4 ]
 *
 * The overall band is NEVER asked of the model — it is computed here from the four.
 */

/** Ollama sometimes returns `criteria` as an object keyed by criterion; lift it to the array form. */
export function normaliseCriteria(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = { ...(raw as Record<string, unknown>) };
  const c = obj.criteria;
  if (c && typeof c === "object" && !Array.isArray(c)) {
    obj.criteria = Object.entries(c as Record<string, unknown>).map(([criterion, entry]) =>
      entry && typeof entry === "object" ? { ...(entry as object), criterion } : { criterion },
    );
  }
  if (Array.isArray(obj.criteria)) {
    obj.criteria = obj.criteria.map((e) => {
      if (!e || typeof e !== "object") return e;
      const id = (e as { criterion?: unknown }).criterion;
      if (typeof id !== "string" || (CRITERIA as readonly string[]).includes(id)) return e;
      const snake = id.trim().toLowerCase().replace(/[\s/&]+/g, "_").replace(/_+/g, "_");
      return (CRITERIA as readonly string[]).includes(snake) ? { ...e, criterion: snake } : e;
    });
  }
  return obj;
}

/** Read the four bands, or explain exactly what is wrong with the core fields. */
export function readBands(output: unknown): { ok: true; bands: Record<Criterion, number> } | { ok: false; error: string } {
  const criteria = (output as { criteria?: unknown } | null)?.criteria;
  if (!Array.isArray(criteria)) return { ok: false, error: "Output has no `criteria` list (a locked core field)." };
  const bands = {} as Record<Criterion, number>;
  for (const entry of criteria) {
    const id = (entry as { criterion?: unknown })?.criterion;
    const band = (entry as { band?: unknown })?.band;
    if (typeof id !== "string" || !(CRITERIA as readonly string[]).includes(id))
      return { ok: false, error: `Unknown criterion id ${JSON.stringify(id)}; use exactly: ${CRITERIA.join(", ")}.` };
    if (typeof band !== "number" || !Number.isInteger(band) || band < 0 || band > 9)
      return { ok: false, error: `Band for ${id} must be a whole number 0–9, got ${JSON.stringify(band)}.` };
    if (id in bands) return { ok: false, error: `Criterion ${id} appears twice.` };
    bands[id as Criterion] = band;
  }
  const missing = CRITERIA.filter((c) => !(c in bands));
  if (missing.length) return { ok: false, error: `Missing criteria: ${missing.join(", ")}.` };
  return { ok: true, bands };
}

/** The official rule: mean of the four, rounded to the nearest half band (.25 → .5, .75 → next whole). */
export function overallBand(bands: Record<Criterion, number>): number {
  const mean = CRITERIA.reduce((s, c) => s + bands[c], 0) / CRITERIA.length;
  const cleaned = Math.round(mean * 1_000_000) / 1_000_000;
  return Math.round(cleaned * 2) / 2;
}

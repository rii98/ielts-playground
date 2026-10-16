import type { Span } from "./types.ts";

/**
 * Quote grounding. LOCKED.
 *
 * Models cannot count characters, so they QUOTE the words they mean and code finds
 * them. This works on ANY output shape: every object with a string `quote` gets the
 * `start`/`end` of that quote in the essay. An object whose quote is not in the
 * essay is a hallucination — it is removed from its list (or, outside a list, kept
 * without a span) and reported in `dropped`.
 */
export function groundQuotes<T>(value: T, essay: string): { value: T; dropped: string[] } {
  const index = buildNormalisedIndex(essay);
  const dropped: string[] = [];

  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) {
      const out: unknown[] = [];
      for (const item of v) {
        if (isQuoted(item)) {
          const span = locateQuote(essay, item.quote, index);
          if (!span) {
            dropped.push(item.quote);
            continue;
          }
          out.push({ ...(walk(item) as object), ...span });
        } else out.push(walk(item));
      }
      return out;
    }
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, child] of Object.entries(v)) out[k] = walk(child);
      if (isQuoted(v)) {
        const span = locateQuote(essay, v.quote, index);
        if (span) Object.assign(out, span);
        else dropped.push(v.quote);
      }
      return out;
    }
    return v;
  };

  return { value: walk(value) as T, dropped };
}

function isQuoted(v: unknown): v is { quote: string } {
  return !!v && typeof v === "object" && !Array.isArray(v) && typeof (v as { quote?: unknown }).quote === "string";
}

interface NormalisedIndex {
  text: string;
  map: number[];
}

/** Exact match first; otherwise match with whitespace runs collapsed (a wrapped line, a double space). */
export function locateQuote(source: string, quote: string, index = buildNormalisedIndex(source)): Span | null {
  if (!quote) return null;
  const exact = source.indexOf(quote);
  if (exact !== -1) return { start: exact, end: exact + quote.length };

  const needle = quote.replace(/\s+/g, " ").trim();
  if (!needle) return null;
  const at = index.text.indexOf(needle);
  if (at === -1) return null;
  return { start: index.map[at]!, end: index.map[at + needle.length - 1]! + 1 };
}

function buildNormalisedIndex(text: string): NormalisedIndex {
  let out = "";
  const map: number[] = [];
  let inSpace = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (/\s/.test(ch)) {
      if (!inSpace) {
        out += " ";
        map.push(i);
        inSpace = true;
      }
    } else {
      out += ch;
      map.push(i);
      inSpace = false;
    }
  }
  return { text: out, map };
}

/**
 * Tolerant JSON extraction (same rules as the app's marker). LOCKED.
 * Strict parse first, then a ```json fence, then the outermost braces — each also
 * with trailing commas removed. Throws if none parse.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const braces = start !== -1 && end > start ? candidate.slice(start, end + 1) : null;

  for (const attempt of [candidate, braces, braces && stripTrailingCommas(braces)]) {
    if (attempt === null) continue;
    try {
      return JSON.parse(attempt);
    } catch {
      /* next */
    }
  }
  throw new Error("The model did not return valid JSON.");
}

/** Drop commas that directly precede `}` or `]`, outside strings only. */
export function stripTrailingCommas(json: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    const c = json[i]!;
    if (inString) {
      out += c;
      if (c === "\\") out += json[++i] ?? "";
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    if (c === ",") {
      let j = i + 1;
      while (j < json.length && /\s/.test(json[j]!)) j++;
      if (json[j] === "}" || json[j] === "]") continue;
    }
    out += c;
  }
  return out;
}

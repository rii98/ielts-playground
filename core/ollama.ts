import { loadEnv } from "./env.ts";

/**
 * One chat call to Ollama (Cloud by default). LOCKED.
 *
 * The output JSON Schema is passed as `format`, so decoding is constrained to the
 * task's shape. Temperature defaults to 0 so the same essay marks the same way twice.
 */

export interface ChatRequest {
  system: string;
  user: string;
  /** Base64 image strings (no data: prefix). */
  images?: string[];
  format: Record<string, unknown>;
  model?: string;
  temperature?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  promptTokens?: number;
  outputTokens?: number;
}

export function settings() {
  loadEnv();
  return {
    key: process.env.OLLAMA_API_KEY?.trim() ?? "",
    model: process.env.OLLAMA_MODEL?.trim() || "gemma4:31b-cloud",
    baseUrl: (process.env.OLLAMA_BASE_URL?.trim() || "https://ollama.com").replace(/\/+$/, ""),
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS || 180_000),
  };
}

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const s = settings();
  if (!s.key) throw new Error("No Ollama key found. Ask Claude to run /setup and paste your key into the .env file.");
  const model = req.model ?? s.model;

  const body = JSON.stringify({
    model,
    stream: false,
    format: req.format,
    options: { temperature: req.temperature ?? 0 },
    messages: [
      { role: "system", content: req.system },
      { role: "user", content: req.user, ...(req.images?.length ? { images: req.images } : {}) },
    ],
  });

  // One retry for the transient failures (rate limit, server busy); anything else is reported.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${s.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${s.key}` },
      body,
      signal: AbortSignal.timeout(s.timeoutMs),
    });
    if (res.ok) {
      const json = (await res.json()) as {
        message?: { content?: string };
        prompt_eval_count?: number;
        eval_count?: number;
      };
      const content = json.message?.content ?? "";
      if (!content) throw new Error("Ollama returned an empty answer.");
      return { content, model, promptTokens: json.prompt_eval_count, outputTokens: json.eval_count };
    }
    const text = (await res.text()).slice(0, 300);
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < 2) {
      await new Promise((r) => setTimeout(r, 4000));
      continue;
    }
    if (res.status === 401 || res.status === 403) throw new Error(`Ollama rejected the key (${res.status}). Check OLLAMA_API_KEY in .env.`);
    if (res.status === 429) throw new Error("Ollama says too many requests (429). Wait a minute and try again.");
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }
}

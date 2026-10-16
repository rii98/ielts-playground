import { chat, settings } from "../core/ollama.ts";

/** `npm run ping` — one tiny call to prove the Ollama key and model work. Never prints the key. */
const s = settings();
if (!s.key) {
  console.error("✗ No OLLAMA_API_KEY in .env yet.");
  process.exit(1);
}
const t0 = Date.now();
try {
  const r = await chat({
    system: "Reply with JSON only.",
    user: 'Return {"ok": true}.',
    format: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] },
  });
  console.log(`✓ Ollama works — model ${r.model}, answered in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
} catch (err) {
  console.error(`✗ ${(err as Error).message}`);
  process.exit(1);
}

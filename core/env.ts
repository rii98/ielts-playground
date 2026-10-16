import { existsSync } from "node:fs";
import { ROOT } from "./paths.ts";
import { join } from "node:path";

let loaded = false;

/** Load `.env` once (Node ≥ 20.12). Values already in the environment win. */
export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  const file = join(ROOT, ".env");
  if (existsSync(file)) process.loadEnvFile(file);
}

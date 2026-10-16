import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The playground folder. */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const TASKS_DIR = join(ROOT, "tasks");
export const REPORTS_DIR = join(ROOT, "reports");
export const RUNS_DIR = join(ROOT, "runs");

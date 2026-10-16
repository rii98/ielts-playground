import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * The playground's tiny backend, served by the Vite dev server itself so the teacher
 * runs ONE command. Handlers are loaded through `ssrLoadModule` on every request, so
 * an edit to a task's prompt, rubric or schema applies on the next Run — no restart.
 */
function playgroundApi(): Plugin {
  return {
    name: "playground-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api", (req, res) => void handle(server, req, res));
    },
  };
}

async function handle(server: ViteDevServer, req: IncomingMessage, res: ServerResponse) {
  try {
    const api = (await server.ssrLoadModule("/core/api.ts")) as typeof import("./core/api.ts");
    const url = new URL(req.url ?? "/", "http://localhost");
    const body = req.method === "POST" ? JSON.parse((await readBody(req)) || "{}") : undefined;
    const out = await api.route(url.pathname, url.searchParams, body);
    if (out.kind === "file") {
      res.setHeader("content-type", out.contentType);
      res.end(out.bytes);
    } else {
      res.setHeader("content-type", "application/json");
      res.statusCode = out.status ?? 200;
      res.end(JSON.stringify(out.json));
    }
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export default defineConfig({ plugins: [react(), playgroundApi()] });

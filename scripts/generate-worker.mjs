import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const assets = [
  ["/", "index.html", "text/html; charset=utf-8"],
  ["/index.html", "index.html", "text/html; charset=utf-8"],
  ["/styles.css", "styles.css", "text/css; charset=utf-8"],
  ["/styles/base.css", "styles/base.css", "text/css; charset=utf-8"],
  ["/styles/game.css", "styles/game.css", "text/css; charset=utf-8"],
  ["/styles/result.css", "styles/result.css", "text/css; charset=utf-8"],
  ["/styles/start.css", "styles/start.css", "text/css; charset=utf-8"],
  ["/src/app.js", "src/app.js", "text/javascript; charset=utf-8"],
  ["/src/game-engine.js", "src/game-engine.js", "text/javascript; charset=utf-8"],
  ["/src/questions.js", "src/questions.js", "text/javascript; charset=utf-8"]
];

const assetEntries = [];
for (const [url, relativePath, contentType] of assets) {
  const body = await readFile(resolve(projectRoot, relativePath), "utf8");
  assetEntries.push([url, { body, contentType }]);
}

const serializedAssets = JSON.stringify(assetEntries).replaceAll("\\u2028", "\\\\u2028").replaceAll("\\u2029", "\\\\u2029");
const workerSource = `const assets = new Map(${serializedAssets});

const notFound = () => new Response("Not found", { status: 404 });

export default {
  async fetch(request, env, ctx) {
    void env;
    void ctx;

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { allow: "GET, HEAD" },
      });
    }

    const url = new URL(request.url);
    const asset = assets.get(url.pathname);
    if (!asset) return notFound();

    return new Response(request.method === "HEAD" ? null : asset.body, {
      headers: {
        "cache-control": "no-cache",
        "content-type": asset.contentType,
      },
    });
  },
};
`;

await mkdir(resolve(projectRoot, "worker"), { recursive: true });
await writeFile(resolve(projectRoot, "worker/index.js"), workerSource);

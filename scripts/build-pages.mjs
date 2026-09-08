import { cp, mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const env = { ...process.env, BASE_PATH: "/Grok-helped-/" };
const build = spawnSync("npm", ["run", "build"], {
  cwd: root,
  env,
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

const output = join(root, ".vercel", "output");
const staticDir = join(output, "static");
const server = await import(`file://${join(output, "functions", "__server.func", "index.mjs")}`);
let response = await server.default.fetch(
  new Request("http://localhost/", { headers: { accept: "text/html" } }),
  {},
);
if (response.status >= 300 && response.status < 400) {
  response = await server.default.fetch(
    new Request(new URL(response.headers.get("location") ?? "/", "http://localhost/"), {
      headers: { accept: "text/html" },
    }),
    {},
  );
}
if (!response.ok) throw new Error(`SSR root render failed: ${response.status}`);

const html = await response.text();
await mkdir(staticDir, { recursive: true });
await writeFile(join(staticDir, "index.html"), html);
await writeFile(join(staticDir, "404.html"), html);
console.log(`[pages] wrote ${join(staticDir, "index.html")}`);

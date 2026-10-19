import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import path from "node:path";
const root = process.cwd(),
  label = "maintenance",
  directory = path.resolve(
    process.argv[2] || "/tmp/shinka-maintenance-measure",
  );
if (directory === root || directory.startsWith(root + path.sep))
  throw new Error("Measurement output must be outside the checkout");
const require = createRequire(path.join(root, "package.json"));
const { build } = await import(require.resolve("vite"));
const { chromium } = require("playwright");
const { default: react } = await import(
  require.resolve("@vitejs/plugin-react")
);
const { default: tailwindcss } = await import(
  require.resolve("@tailwindcss/vite")
);
const { staticEvidencePlugin } = await import(
  path.join(root, "scripts/staticEvidence.mjs")
);
await mkdir(directory, { recursive: true });
const summarize = (bundle) => {
  const chunks = Object.values(bundle),
    entry = chunks.find((c) => c.type === "chunk" && c.isEntry),
    initial = new Set();
  const visit = (file) => {
    if (initial.has(file)) return;
    initial.add(file);
    const c = bundle[file];
    for (const dependency of c?.imports || []) visit(dependency);
  };
  visit(entry.fileName);
  const modules = [...initial]
    .flatMap((file) => Object.keys(bundle[file]?.modules || {}))
    .filter((id) => id.startsWith(root) && !id.includes("node_modules"))
    .map((id) => id.slice(root.length));
  const size = (list) =>
    list.reduce(
      (r, c) => {
        const code = c.type === "chunk" ? c.code : c.source;
        return {
          raw: r.raw + Buffer.byteLength(code),
          gzip: r.gzip + gzipSync(code).length,
        };
      },
      { raw: 0, gzip: 0 },
    );
  return {
    initialJS: size(chunks.filter((c) => initial.has(c.fileName))),
    allJS: size(chunks.filter((c) => c.type === "chunk")),
    css: size(chunks.filter((c) => c.fileName.endsWith(".css"))),
    initialModules: modules,
    chunkCount: chunks.filter((c) => c.type === "chunk").length,
  };
};
let production,
  lab,
  graph = [];
await build({
  root,
  logLevel: "warn",
  build: { outDir: path.join(directory, "production"), manifest: true },
  plugins: [
    {
      name: "maintenance-measure",
      generateBundle(_, bundle) {
        production = summarize(bundle);
        graph = [...this.getModuleIds()]
          .filter((id) => id.startsWith(root) && !id.includes("node_modules"))
          .map((id) => {
            const m = this.getModuleInfo(id);
            return {
              id: id.slice(root.length),
              imports: m.importedIds
                .filter(
                  (x) => x.startsWith(root) && !x.includes("node_modules"),
                )
                .map((x) => x.slice(root.length)),
              dynamic: m.dynamicallyImportedIds
                .filter(
                  (x) => x.startsWith(root) && !x.includes("node_modules"),
                )
                .map((x) => x.slice(root.length)),
            };
          });
      },
    },
  ],
});
await build({
  root,
  configFile: false,
  logLevel: "warn",
  plugins: [
    staticEvidencePlugin(root),
    tailwindcss(),
    react(),
    {
      name: "lab-measure",
      generateBundle(_, bundle) {
        lab = summarize(bundle);
      },
    },
  ],
  resolve: {
    alias: [
      {
        find: "@/api/base44Client",
        replacement: path.join(root, "scripts/testHarness/fakeBase44.js"),
      },
      { find: "@", replacement: path.join(root, "src") },
    ],
  },
  build: { outDir: path.join(directory, "lab"), emptyOutDir: true },
});
const byId = new Map(graph.map((m) => [m.id, m]));
const cycles = new Set();
function walk(id, stack = [], seen = new Set()) {
  if (stack.includes(id)) {
    cycles.add(stack.slice(stack.indexOf(id)).concat(id).join(" -> "));
    return;
  }
  if (seen.has(id)) return;
  seen.add(id);
  for (const child of byId.get(id)?.imports || [])
    walk(child, [...stack, id], seen);
}
for (const id of byId.keys()) walk(id);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost"),
      p = url.pathname.startsWith("/assets/")
        ? path.join(directory, "lab", url.pathname)
        : path.join(directory, "lab/index.html");
    const bytes = await readFile(p);
    res.setHeader(
      "Content-Type",
      p.endsWith(".js")
        ? "application/javascript"
        : p.endsWith(".css")
          ? "text/css"
          : "text/html",
    );
    res.end(bytes);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const pages = [];
let lazyRetry;
try {
  browser = await chromium.launch({ headless: true });
  for (const route of [
    "/",
    "/login",
    "/internal/build?sdkSession=admin",
    "/internal/health?sdkSession=admin",
  ]) {
    const samples = [];
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext({
        viewport: { width: 360, height: 740 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("**/*", (r) =>
        new URL(r.request().url()).origin === origin ? r.continue() : r.abort(),
      );
      await page.addInitScript(() => {
        window.__shifts = [];
        window.__longTasks = [];
        try {
          new PerformanceObserver((list) =>
            window.__shifts.push(
              ...list
                .getEntries()
                .filter((e) => !e.hadRecentInput)
                .map((e) => e.value),
            ),
          ).observe({ type: "layout-shift", buffered: true });
          new PerformanceObserver((list) =>
            window.__longTasks.push(
              ...list.getEntries().map((e) => e.duration),
            ),
          ).observe({ type: "longtask", buffered: true });
        } catch {}
      });
      await page.goto(origin + route);
      await page.waitForSelector("[data-probe-root]");
      await page.waitForLoadState("networkidle");
      const metrics = await page.evaluate(() => ({
        domNodes: document.querySelectorAll("*").length,
        js: performance
          .getEntriesByType("resource")
          .filter((r) => r.name.endsWith(".js"))
          .map((r) => ({
            url: new URL(r.name).pathname,
            bytes: r.decodedBodySize,
          })),
        css: performance
          .getEntriesByType("resource")
          .filter((r) => r.name.endsWith(".css"))
          .reduce((n, r) => n + r.decodedBodySize, 0),
        domContentLoaded:
          performance.getEntriesByType("navigation")[0]
            .domContentLoadedEventEnd,
        paint: performance
          .getEntriesByType("paint")
          .map((p) => ({ name: p.name, start: p.startTime })),
        cls: window.__shifts.reduce((a, b) => a + b, 0),
        longTaskTotal: window.__longTasks.reduce((a, b) => a + b, 0),
        scrollWidth: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      samples.push({ ...metrics, errors });
      await context.close();
    }
    pages.push({ route, samples });
  }
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    page = await context.newPage();
  let failChunk = true;
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin !== origin
      ? r.abort()
      : failChunk &&
          /\/HealthCenter-[^/]+\.js$/.test(new URL(r.request().url()).pathname)
        ? r.abort()
        : r.continue(),
  );
  await page.goto(origin + "/internal/health?sdkSession=admin");
  await page.waitForSelector('[data-state="LOAD_FAILURE"][role="alert"]');
  failChunk = false;
  await page.locator('[data-state="LOAD_FAILURE"] button').click();
  await page.waitForSelector("[data-health-root]");
  lazyRetry = {
    passed: true,
    scope:
      "Synthetic network asset failure and full-reload retry, real App route",
  };
  await context.close();
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
const report = {
  lazyRetry,
  label,
  measuredAt: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    browser:
      "Playwright Chromium, headless, cold context, 360x740, loopback, no throttling; SDK transport stubbed, external fonts blocked; not user metrics",
  },
  production,
  lab,
  pages,
  cycles: [...cycles],
};
await writeFile(
  path.join(directory, "measurements.json"),
  JSON.stringify(report, null, 2),
);
await writeFile(
  path.join(directory, "graph.json"),
  JSON.stringify(graph, null, 2),
);
const budget = {
  initialRaw: 500000,
  initialGzip: 165000,
  cssRaw: 90000,
  cssGzip: 16000,
};
const passed =
  lazyRetry?.passed &&
  production.initialJS.raw <= budget.initialRaw &&
  production.initialJS.gzip <= budget.initialGzip &&
  production.css.raw <= budget.cssRaw &&
  production.css.gzip <= budget.cssGzip &&
  !production.initialModules.some((file) =>
    /\/foundation\/tests\//.test(file),
  ) &&
  !cycles.size &&
  pages.every((p) => p.samples.every((s) => !s.errors.length));
if (!passed) process.exitCode = 1;
console.log(
  JSON.stringify({
    budget,
    passed,
    label,
    production,
    cycles: [...cycles],
    pages: pages.map((p) => ({
      route: p.route,
      samples: p.samples.map((s) => ({
        js: s.js.reduce((n, r) => n + r.bytes, 0),
        dom: s.domNodes,
        dcl: s.domContentLoaded,
        cls: s.cls,
        errors: s.errors,
      })),
    })),
  }),
);

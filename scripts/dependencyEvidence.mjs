import path from "node:path";
import { syntaxNodes } from "../src/foundation/inspection/sourceRules.js";

// Resolve repository static edges only; dynamic route imports are intentionally
// outside the initial closure. Actual emitted byte budgets are measured separately.
export function inspectDependencies(sources) {
  const graph = new Map();
  const violations = [];
  for (const [file, code] of Object.entries(sources)) {
    const edges = [];
    for (const node of syntaxNodes(code)) {
      if (
        ![
          "ImportDeclaration",
          "ExportNamedDeclaration",
          "ExportAllDeclaration",
          "ImportExpression",
        ].includes(node.type)
      )
        continue;
      const spec = node.source?.value;
      if (
        typeof spec !== "string" ||
        (!spec.startsWith(".") && !spec.startsWith("@/"))
      )
        continue;
      const base = spec.startsWith("@/")
        ? `/src/${spec.slice(2)}`
        : path.posix.resolve(path.posix.dirname(file), spec);
      const resolved = [
        base,
        ...[".js", ".jsx", ".ts", ".tsx", "/index.js", "/index.jsx"].map(
          (ext) => base + ext,
        ),
      ].find((candidate) => candidate in sources);
      if (!resolved) continue; // CSS, JSON and external assets have no JS edges.
      if (node.type !== "ImportExpression") edges.push(resolved);
      if (file.startsWith("/base44/") && resolved.startsWith("/src/"))
        violations.push({ file, dependency: resolved });
    }
    graph.set(file, edges);
  }
  const closure = new Set();
  function visit(file) {
    if (closure.has(file)) return;
    closure.add(file);
    for (const child of graph.get(file) || []) visit(child);
  }
  visit("/src/App.jsx");
  // The authorization guard and exact path constant must remain eager; they import no tooling.
  const routingOnly = new Set([
    "/src/components/internal/AdminGate.jsx",
    "/src/foundation/probes/authProbeRoute.js",
  ]);
  const eagerInternal = [...closure].filter(
    (file) =>
      !routingOnly.has(file) &&
      /^\/src\/(pages\/internal|components\/internal|foundation\/(tests|health|probes))\//.test(
        file,
      ),
  );
  const done = new Set(),
    active = new Set(),
    cycles = [];
  function cycle(file, trail = []) {
    if (active.has(file)) {
      cycles.push([...trail.slice(trail.indexOf(file)), file]);
      return;
    }
    if (done.has(file)) return;
    active.add(file);
    for (const child of graph.get(file) || []) cycle(child, [...trail, file]);
    active.delete(file);
    done.add(file);
  }
  for (const file of graph.keys()) cycle(file);
  return {
    ok: !eagerInternal.length && !violations.length && !cycles.length,
    staticModules: closure.size,
    eagerInternal,
    violations,
    cycles,
  };
}

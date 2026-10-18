// Lazy raw loaders for STATIC inspection (internal tooling only; loaded on demand).
const srcLoaders = import.meta.glob("/src/**/*.{js,jsx}", { query: "?raw", import: "default" });
const docLoaders = import.meta.glob("/docs/shinka/*.md", { query: "?raw", import: "default" });

async function loadAll(loaders) {
  const out = {};
  await Promise.all(Object.entries(loaders).map(async ([path, load]) => { out[path] = await load(); }));
  return out;
}

export const loadSources = () => loadAll(srcLoaders);
export const loadDocs = () => loadAll(docLoaders);
export const sourcePaths = () => Object.keys(srcLoaders);
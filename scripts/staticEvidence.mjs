import { inspectDependencies } from './dependencyEvidence.mjs';
import { renderBuildHistory } from '../src/foundation/buildHistoryPolicy.js';
// Build/server-only inspection. Only allowlisted results + hashes enter the virtual module.
import { inspectGeoNamesEntry, inspectOnboardingSurface } from '../src/foundation/inspection/onboardingRules.js';
import { ONBOARDING_COPY } from '../src/foundation/i18n/onboardingCopy.js';
import { TERMS_COPY } from '../src/foundation/i18n/termsCopy.js';
import { APPROVED_COPY } from '../src/foundation/uiuxTables.js';
import fs from "node:fs";
import { inspectProductWriteSurface } from "../src/foundation/inspection/domainRules.js";
import { inspectDomainSchemas } from "./domainEvidence.mjs";
import path from "node:path";
import { createHash } from "node:crypto";
import ts from "typescript";
import { checkSingleSource, findLegacyImports, findSecrets, findPersonalEmails, missingBoundaries, checkInternalUiPurity, checkAuthSurface } from "../src/foundation/inspection/sourceRules.js";
import { checkDocs } from "../src/foundation/inspection/docRules.js";
import { BUILD_MARKER } from "../src/foundation/buildMarker.js";
import { BUILD_LEDGER } from "../src/foundation/buildLedger.js";
import { DOMAIN_ENTITIES } from "../src/foundation/domainContract.js";
import { OPEN_DECISIONS } from "../src/foundation/openDecisions.js";
import { EXPECTED_UIUX_PARTS, SOURCE_PROVENANCE, ORIGINAL_ARTIFACTS_HASH_VERIFIED_IN_REPO } from "../src/foundation/sourceInventory.js";

export function buildStaticEvidence(root = process.cwd()) {
  const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
  const scan = (dir, re) => fs.readdirSync(path.join(root, dir), { recursive: true, encoding:"utf8" }).filter((p) => re.test(p) && !p.endsWith(".d.ts")).map((p) => `${dir}/${p.split(path.sep).join("/")}`);
  const files = [...scan("src", /\.(js|jsx|ts|tsx|css)$/), ...scan("base44", /\.(js|ts|jsonc)$/), ...scan("scripts", /\.(js|mjs|jsx)$/),
    ...fs.readdirSync(root).filter((p) => /(?:config\.[cm]?js|package\.json)$/.test(p))].sort();
  const raw = Object.fromEntries(files.map((p) => [`/${p}`, read(p)]));
  const syntax = Object.fromEntries(Object.entries(raw).filter(([p]) => /\.(js|mjs|jsx|ts|tsx)$/.test(p)).map(([p,code]) => [p, /\.tsx?$/.test(p) ? ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, verbatimModuleSyntax: true, jsx: ts.JsxEmit.Preserve } }).outputText : code]));
  const docFiles = scan("docs/shinka", /\.md$/).sort();
  const docs = Object.fromEntries(docFiles.map((p) => [`/${p}`, read(p)]));
  const { byName, ...docResult } = checkDocs(docs, BUILD_MARKER);
  const truth = byName["SHINKA_SOURCE_OF_TRUTH.md"] || "";
  const history = byName["SHINKA_BUILD_HISTORY.md"] || "";
  const hardcoded = ["/src/pages/Home.jsx", "/src/pages/Calendar.jsx", "/src/pages/Pattern.jsx", "/src/pages/You.jsx", "/src/components/shinka/ProductNavigation.jsx", "/src/components/shinka/StatePanel.jsx"].flatMap((file) => ["Home", "Calendar", "Pattern", "Retry"].filter((s) => raw[file]?.includes(`>${s}<`) || raw[file]?.includes(`"${s}"`)).map(() => ({ file })));
  const shellUsesContract = raw["/src/components/shinka/ProductNavigation.jsx"]?.includes("BOTTOM_NAV.map") &&
    ["Home", "Calendar", "Pattern"].every(page => {
      const source = raw[`/src/pages/${page}.jsx`] || "";
      return source.includes("@/components/shinka/ProductNavigation") && source.includes("<ProductNavigation");
    });
  const hashes = Object.fromEntries([...Object.entries(raw), ...Object.entries(docs)].map(([p,c]) => [p,createHash("sha256").update(c).digest("hex")]));
  return {
    schema: "shinka.static-evidence/1", buildMarker: BUILD_MARKER, generatedAt: new Date().toISOString(),
    evidenceScope: "BUILD_TIME_REPOSITORY_INSPECTION", originalArtifactProvenance: SOURCE_PROVENANCE,
    originalArtifactsHashVerifiedInRepo: ORIGINAL_ARTIFACTS_HASH_VERIFIED_IN_REPO, hashes, sourceCount: files.length, docCount: docFiles.length,
    dependencies: inspectDependencies(syntax),
    activeBuildHistory: { generatedMatches: history === renderBuildHistory(BUILD_LEDGER, BUILD_MARKER), entries: BUILD_LEDGER.length },
    domain: { ...inspectDomainSchemas(root), writeSurface: inspectProductWriteSurface(syntax) },
    onboarding: inspectOnboardingSurface(syntax,[...Object.values(APPROVED_COPY).flat(),...Object.values(ONBOARDING_COPY.en),...Object.values(ONBOARDING_COPY.tr),...Object.values(TERMS_COPY.en),...Object.values(TERMS_COPY.tr)]),
    geoNamesEntry: inspectGeoNamesEntry(syntax['/base44/functions/onboarding/entry.ts']||''),
    marker: checkSingleSource(syntax), legacy: findLegacyImports(syntax), secretFiles: findSecrets(raw), emailFiles: findPersonalEmails(raw),
    boundaries: missingBoundaries(Object.keys(raw)), internalUi: checkInternalUiPurity(syntax), authSurface: checkAuthSurface(syntax),
    ui: { hardcoded, shellUsesContract },
    docs: { ...docResult,
      undocumentedDecisions: OPEN_DECISIONS.filter((d) => !truth.includes(d.id)).map((d) => d.id),
      splitDocumented: EXPECTED_UIUX_PARTS.every((p) => truth.includes(p)) && /Logical source count:\*\*\s*1\b/.test(truth),
      companionDocumented: (byName["SHINKA_UI_UX_STANDARDS.md"] || "").includes("Shinka_UI_UX_v1.1_Machine_Readable_Tables_Companion.docx"),
      missingDomainEntities: DOMAIN_ENTITIES.filter((d) => !(byName["SHINKA_DATA_MODEL.md"] || "").includes(d.name)).map((d) => d.name),
      buildHistoryMismatches: BUILD_LEDGER.filter((e) => history.split(`## ${e.build_marker} — ${e.package_name}`).length !== 2).map((e) => e.build_marker),
    },
  };
}
export function staticEvidencePlugin(root = process.cwd()) {
  const id = "virtual:shinka-static-evidence";
  return { name: "shinka-static-evidence", resolveId(source) { if (source === id) return `\0${id}`; },
    load(source) { if (source === `\0${id}`) return `export default ${JSON.stringify(buildStaticEvidence(root))};`; },
    handleHotUpdate(ctx) { if (/\/(src|base44|docs)\//.test(ctx.file)) { const m=ctx.server.moduleGraph.getModuleById(`\0${id}`); if(m) ctx.server.moduleGraph.invalidateModule(m); } },
  };
}

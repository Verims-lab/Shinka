// Pure static-inspection rules shared by Health and foundation tests (single implementation).
const MARKER_LITERAL = /Buildmarker-\d{3}/g;
export const MARKER_ROLES = {
  "/src/foundation/buildMarker.js": "AUTHORITY",
  "/src/foundation/buildLedger.js": "HISTORY",
  "/src/foundation/tests/foundationTests.js": "FIXTURE",
};

export function checkSingleSource(sources) {
  const authorityExports = Object.keys(sources).filter((p) => /export\s+const\s+BUILD_MARKER\s*=/.test(sources[p]));
  const literalFiles = Object.keys(sources).filter((p) => (sources[p].match(MARKER_LITERAL) || []).length > 0);
  const unexpected = literalFiles.filter((p) => !MARKER_ROLES[p]);
  const ok = authorityExports.length === 1 && authorityExports[0] === "/src/foundation/buildMarker.js" && unexpected.length === 0;
  return { ok, authorityExports, literalFiles, unexpected };
}

const IMPORT_RE = /(?:import|export)\s[^'";]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;
export function importsOf(code) {
  const out = [];
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(code))) out.push(m[1] || m[2] || m[3]);
  return out;
}

const LEGACY_IMPORT_PATTERNS = [/legacy/i, /shinka[-_]?(old|prev|v0)/i, /check-?in/i, /symptom/i, /premium/i, /openai|anthropic/i];
export function findLegacyImports(sources) {
  const hits = [];
  for (const [p, code] of Object.entries(sources)) {
    for (const spec of importsOf(code)) if (LEGACY_IMPORT_PATTERNS.some((re) => re.test(spec))) hits.push({ file: p, spec });
    if (/integrations\.Core\.InvokeLLM/.test(code)) hits.push({ file: p, spec: "AI_CALL" });
  }
  return hits;
}

const SECRET_PATTERNS = [
  /sk_(live|test)_[A-Za-z0-9]{10,}/, /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, /(api[_-]?key|secret|password)\s*[:=]\s*['"][^'"\s]{12,}['"]/i,
];
export const findSecrets = (sources) =>
  Object.entries(sources).filter(([, c]) => SECRET_PATTERNS.some((re) => re.test(c))).map(([p]) => p);

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const ALLOWED_EMAIL_DOMAINS = /@example\.(com|org|net)$/i;
export function findPersonalEmails(sources) {
  const hits = [];
  for (const [p, c] of Object.entries(sources)) {
    if (MARKER_ROLES[p] === "FIXTURE") continue; // synthetic redaction fixtures only
    for (const m of c.match(EMAIL_RE) || []) if (!ALLOWED_EMAIL_DOMAINS.test(m)) hits.push({ file: p });
  }
  return hits;
}

export const BOUNDARY_MODULES = [
  "/src/foundation/buildMarker.js", "/src/foundation/buildMarkerRules.js", "/src/foundation/buildLedger.js",
  "/src/foundation/errors.js", "/src/foundation/designTokens.js", "/src/foundation/health/runner.js",
  "/src/foundation/health/aggregate.js", "/src/foundation/health/report.js",
  "/src/services/internal/healthRunStore.js", "/src/services/internal/artifactService.js", "/src/services/internal/entityProbeService.js",
];
export const missingBoundaries = (paths) => BOUNDARY_MODULES.filter((m) => !paths.includes(m));

const UI_ALLOWED = [/^react$/, /^react-router-dom$/, /^lucide-react$/, /^framer-motion$/, /^@\/components\//, /^@\/foundation\//, /^@\/services\/internal\//, /^@\/lib\/AuthContext$/];
const UI_FORBIDDEN_TOKENS = /\.entities\.|functions\.invoke|shinka_date|cycle_length|sun_sign|moon_phase_code/;
export function checkInternalUiPurity(sources) {
  const files = Object.keys(sources).filter((p) => p.startsWith("/src/pages/internal/") || p.startsWith("/src/components/internal/"));
  const violations = [];
  for (const p of files) {
    for (const spec of importsOf(sources[p])) if (!UI_ALLOWED.some((re) => re.test(spec))) violations.push({ file: p, spec });
    if (UI_FORBIDDEN_TOKENS.test(sources[p])) violations.push({ file: p, spec: "FORBIDDEN_TOKEN" });
  }
  return { files: files.length, violations };
}
// Canonical documentation rules (pure).
export const REQUIRED_DOCS = [
  "SHINKA_SOURCE_OF_TRUTH.md", "SHINKA_BUSINESS_FLOW.md", "SHINKA_TECHNICAL_ARCHITECTURE.md", "SHINKA_DATA_MODEL.md",
  "SHINKA_CONTENT_MODEL.md", "SHINKA_UI_UX_STANDARDS.md", "SHINKA_CODE_STANDARDS.md", "SHINKA_DEVELOPMENT_RULES.md",
  "SHINKA_SECURITY_PRIVACY.md", "SHINKA_RELEASE_HEALTH_CHECK.md", "SHINKA_DEVELOPMENT_NOTES.md", "SHINKA_BUILD_HISTORY.md",
];
export const HEADER_FIELDS = ["Document", "Status", "Current BuildMarker", "Last Updated", "Authoritative Source References", "Purpose", "Scope"];

const fieldValue = (text, field) => {
  const m = text.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`));
  return m ? m[1].trim() : null;
};

export function checkDocs(docs, canonicalMarker) {
  const byName = Object.fromEntries(Object.entries(docs).map(([p, t]) => [p.split("/").pop(), t]));
  const missing = REQUIRED_DOCS.filter((n) => !byName[n]);
  const headerGaps = [];
  const misaligned = [];
  for (const n of REQUIRED_DOCS.filter((d) => byName[d])) {
    const head = byName[n].slice(0, 2500);
    HEADER_FIELDS.forEach((f) => { if (!fieldValue(head, f)) headerGaps.push(`${n}:${f}`); });
    const marker = fieldValue(head, "Current BuildMarker");
    if (marker !== canonicalMarker) misaligned.push({ doc: n, marker });
  }
  return { present: REQUIRED_DOCS.length - missing.length, missing, headerGaps, misaligned, byName };
}
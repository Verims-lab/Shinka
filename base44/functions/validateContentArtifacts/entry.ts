// INTERNAL TOOLING — admin-only, read-only content artifact validation. Performs NO import.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { readFirstSheet } from "../../shared/xlsxReader.ts";
import { ARTIFACT_URLS } from "../../shared/contentArtifactSources.ts";
import {
  validateContentRows, validateMappingRows, compareBaseAndExtended, stripInternal,
  CONTENT_COLUMNS, MAPPING_COLUMNS,
} from "../../shared/contentArtifactValidator.ts";

async function loadSheet(url) {
  const started = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`ARTIFACT_FETCH_HTTP_${res.status}`);
  const { rows, sheetFile } = await readFirstSheet(await res.arrayBuffer());
  return { rows, sheetFile, fetchMs: Date.now() - started };
}

function fixtureRun() {
  // Deterministic synthetic fixtures: one duplicate Pair ID, one missing EN cell, one duplicate mapping.
  const content = [CONTENT_COLUMNS,
    ["SHF-001", "Dinlenme & Yavaşlama", "a", "b", "c", "d"],
    ["SHF-001", "Dinlenme & Yavaşlama", "a", "b", "c", "d"],
    ["SHF-002", "Yenilik & Keşif", "a", "b", "", "d"]];
  const mapping = [MAPPING_COLUMNS,
    ["Koç", "Yeni Ay", "Menstrüel", "Dinlenme & Yavaşlama"],
    ["Koç", "Yeni Ay", "Menstrüel", "Yenilik & Keşif"]];
  const c = validateContentRows(content);
  const m = validateMappingRows(mapping, false);
  return {
    contentDuplicateIds: c.duplicateIds, contentMissingCellCount: c.missingCellCount,
    mappingDuplicates: m.duplicates, mappingMissingCombinations: m.missingCombinations,
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error_code: "AUTH_REQUIRED" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error_code: "FORBIDDEN_INTERNAL_TOOLING" }, { status: 403 });
    const { mode } = await req.json().catch(() => ({}));
    if (mode === "fixture") return Response.json({ mode: "fixture", result: fixtureRun() });

    const [content, m192, m240] = await Promise.all([
      loadSheet(ARTIFACT_URLS.content260), loadSheet(ARTIFACT_URLS.mapping192), loadSheet(ARTIFACT_URLS.mapping240),
    ]);
    const c = validateContentRows(content.rows);
    const base = validateMappingRows(m192.rows, false);
    const ext = validateMappingRows(m240.rows, true);
    const relation = compareBaseAndExtended(base, ext);
    return Response.json({
      mode: "live", validatedAt: new Date().toISOString(), importPerformed: false,
      content260: { readable: true, fetchMs: content.fetchMs, ...c },
      mapping192: { readable: true, fetchMs: m192.fetchMs, ...stripInternal(base) },
      mapping240: { readable: true, fetchMs: m240.fetchMs, ...stripInternal(ext) },
      relation,
    });
  } catch (error) {
    return Response.json({ error_code: "ARTIFACT_VALIDATION_FAILED", reason: String(error?.message || "unknown").slice(0, 120) }, { status: 500 });
  }
}
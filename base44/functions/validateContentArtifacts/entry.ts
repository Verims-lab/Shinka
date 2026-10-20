import { withUserLifecycle } from '../../shared/userLifecycle.js';
import { handleInternalRequest } from "../../shared/internalAuthorization.js";
// INTERNAL TOOLING — admin-only, read-only content artifact validation. Performs NO import.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { readFirstSheet } from "../../shared/xlsxReader.ts";
import { ARTIFACT_URLS } from "../../shared/contentArtifactSources.ts";
import {
  validateContentRows, validateMappingRows, compareBaseAndExtended, stripInternal,
  validatorFixtureResult,
} from "../../shared/contentArtifactValidator.ts";

async function loadSheet(url) {
  const started = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`ARTIFACT_FETCH_HTTP_${res.status}`);
  const { rows, sheetFile } = await readFirstSheet(await res.arrayBuffer());
  return { rows, sheetFile, fetchMs: Date.now() - started };
}

async function artifactOperation(_client, { mode }) {
    if (mode === "fixture") return { mode:"fixture", result:validatorFixtureResult() };
    const [content, m192, m240] = await Promise.all([
      loadSheet(ARTIFACT_URLS.content260), loadSheet(ARTIFACT_URLS.mapping192), loadSheet(ARTIFACT_URLS.mapping240),
    ]);
    const c = validateContentRows(content.rows);
    const base = validateMappingRows(m192.rows, false);
    const ext = validateMappingRows(m240.rows, true);
    const relation = compareBaseAndExtended(base, ext);
    return {
      mode: "live", validatedAt: new Date().toISOString(), importPerformed: false,
      content260: { readable: true, fetchMs: content.fetchMs, ...c },
      mapping192: { readable: true, fetchMs: m192.fetchMs, ...stripInternal(base) },
      mapping240: { readable: true, fetchMs: m240.fetchMs, ...stripInternal(ext) },
      relation,
    };
}
export default (req) => handleInternalRequest(req, request => withUserLifecycle(createClientFromRequest(request)), artifactOperation);

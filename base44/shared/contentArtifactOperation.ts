import { InternalError } from './internalAuthorization.js';
import { healthReadDiagnostic } from './healthReadDiagnostics.js';
import { readFirstSheet } from "./xlsxReader.ts";
import { ARTIFACT_URLS } from "./contentArtifactSources.ts";
import {
  validateContentRows, validateMappingRows, compareBaseAndExtended, stripInternal,
  validatorFixtureResult,
} from "./contentArtifactValidator.ts";

function artifactFailure(error, stage, started) {
  const code = { ARTIFACT_DOWNLOAD: 'ARTIFACT_DOWNLOAD_FAILED', ARTIFACT_PARSE: 'ARTIFACT_PARSE_FAILED', ARTIFACT_VALIDATION: 'ARTIFACT_VALIDATION_FAILED' }[stage];
  const failure = new InternalError(code, 502);
  failure.stage = stage;
  failure.diagnostic = healthReadDiagnostic(error, { stage, durationMs: Date.now() - started });
  if (stage !== 'ARTIFACT_DOWNLOAD') failure.diagnostic.code = code;
  throw failure;
}
async function loadSheet(url, fetchImpl, readSheet) {
  const started = Date.now();
  let bytes;
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw { status: res.status };
    bytes = await res.arrayBuffer();
  } catch (error) { artifactFailure(error, 'ARTIFACT_DOWNLOAD', started); }
  const downloaded = Date.now();
  try {
    const { rows, sheetFile } = await readSheet(bytes);
    return { rows, sheetFile, fetchMs: downloaded - started };
  } catch (error) { artifactFailure(error, 'ARTIFACT_PARSE', downloaded); }
}

export async function artifactOperation(_client, { mode }, { fetchImpl = fetch, readSheet = readFirstSheet } = {}) {
  if (mode === "fixture") return { mode:"fixture", result:validatorFixtureResult() };
  const [content, m192, m240] = await Promise.all([
    loadSheet(ARTIFACT_URLS.content260, fetchImpl, readSheet), loadSheet(ARTIFACT_URLS.mapping192, fetchImpl, readSheet), loadSheet(ARTIFACT_URLS.mapping240, fetchImpl, readSheet),
  ]);
  const started = Date.now();
  try {
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
  } catch (error) { artifactFailure(error, 'ARTIFACT_VALIDATION', started); }
}

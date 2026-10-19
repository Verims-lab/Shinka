// Read-only source extraction. Never edits a workbook or contacts the live app.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFirstSheet } from '../base44/shared/xlsxReader.ts';
import { validateContentRows, validateMappingRows, compareBaseAndExtended, contentIntegrity, mappingIntegrity } from '../base44/shared/contentArtifactValidator.ts';

const directory = process.argv[2];
if (!directory) throw new Error('Supply the directory containing the three approved workbooks');
const names = ['Shinka_Free_260_YS_Suggestion_TR_EN.xlsx', 'Shinka_Free_240_Eslestirme_40Gun_Test_Sade.xlsx', 'Shinka_Free_192_Kategori_Eslestirme.xlsx'];
const sources = [];
const sheets = [];
for (const name of names) {
  const bytes = await fs.readFile(path.join(directory, name));
  const sheet = await readFirstSheet(bytes);
  sources.push({ name, sha256: createHash('sha256').update(bytes).digest('hex'), worksheet: sheet.sheetFile, rows: sheet.rows.length - 1 });
  sheets.push(sheet.rows);
}
const content = validateContentRows(sheets[0]);
const extended = validateMappingRows(sheets[1], true);
const base = validateMappingRows(sheets[2], false);
const relation = compareBaseAndExtended(base, extended);
if (!contentIntegrity(content) || !mappingIntegrity(base) || !mappingIntegrity(extended) || !relation.relationshipHolds) throw new Error('SOURCE_INTEGRITY_FAILED');
const ids = sheets[0].slice(1).map(row => row[0]);
if (ids.some((id, index) => id !== `SHF-${String(index + 1).padStart(3, '0')}`)) throw new Error('SOURCE_ID_SET_INVALID');
if (new Set(sheets[0].slice(1).map(row => JSON.stringify(row.slice(1)))).size !== 260) throw new Error('AMBIGUOUS_SOURCE_PAIR');
const payload = { sourceSet: 'SRC-2026-10-18', sources, pairs: sheets[0].slice(1), mappings: sheets[1].slice(1) };
const sha256 = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
const manifest = { ...payload, sha256 };
const destination = new URL('../base44/shared/firstContentSource.js', import.meta.url);
await fs.writeFile(destination, `// Generated from approved workbook bytes by prepareFirstContent.mjs. Backend only.\nexport const FIRST_CONTENT_SOURCE = ${JSON.stringify(manifest, null, 2)};\n`);
await fs.writeFile(new URL('../base44/shared/contentSourceReceipt.js', import.meta.url), `// Generated source receipt only; no product text.\nexport const CONTENT_SOURCE_SHA256 = ${JSON.stringify(sha256)};\n`);
console.log(JSON.stringify({ sha256, sources, categories: content.perCategory, exactPairIds: true, relationship: relation, scope: 'REPOSITORY_PREPARATION_NOT_LIVE_IMPORT' }, null, 2));

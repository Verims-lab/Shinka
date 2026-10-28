import { InternalError } from './internalAuthorization.js';
import { verifiedDailyRecord } from './dailyRecord.js';

export const DAILY_TEXT_FIELDS = Object.freeze(['message_tr', 'suggestion_tr', 'message_en', 'suggestion_en']);
export const LEGACY_DAILY_TEXT_FIELDS = Object.freeze(DAILY_TEXT_FIELDS.map(key => `${key}_snapshot`));
export const DAILY_TEXT_BATCH = 100;
const fail = (code, pairId = null) => {
  const error = new InternalError(code, 409);
  error.diagnostic = { stage: 'DAILY_CONTENT_REFERENCE', ...(pairId ? { message_pair_id: pairId } : {}) };
  throw error;
};
// Request-local resolution only. Historical assignments do not depend on the
// source's current category or selection eligibility; never fall back to copy.
export async function readMessageTextMap(client, ids) {
  if (!Array.isArray(ids) || ids.length > 4000 || ids.some(id => typeof id !== 'string' || !id.trim())) fail('DAILY_CONTENT_REFERENCE_INVALID');
  const unique = [...new Set(ids)], result = new Map();
  for (let i = 0; i < unique.length; i += DAILY_TEXT_BATCH) {
    const batch = unique.slice(i, i + DAILY_TEXT_BATCH);
    const rows = await client.asServiceRole.entities.MessagePair.filter({ id: { $in: batch } }, 'id', batch.length + 1, 0, ['id', ...DAILY_TEXT_FIELDS]);
    if (!Array.isArray(rows) || rows.length > batch.length) fail('DAILY_CONTENT_REFERENCE_INVALID');
    for (const row of rows) {
      if (!batch.includes(row?.id) || result.has(row.id) || DAILY_TEXT_FIELDS.some(key => typeof row[key] !== 'string' || !row[key].trim())) fail('DAILY_CONTENT_REFERENCE_INVALID');
      result.set(row.id, Object.fromEntries(DAILY_TEXT_FIELDS.map(key => [`${key}_snapshot`, row[key]])));
    }
    for (const id of batch) if (!result.has(id)) fail('DAILY_CONTENT_REFERENCE_MISSING', id);
  }
  return result;
}
export async function dailyResponseRecord(client, row, owner, day, currentTexts = null) {
  const record = verifiedDailyRecord(row, owner, day);
  const texts = currentTexts?.has(record.message_pair_id) ? currentTexts : await readMessageTextMap(client, [record.message_pair_id]);
  // Compatibility names are response-only, derived from MessagePair now.
  return { ...record, ...texts.get(record.message_pair_id) };
}

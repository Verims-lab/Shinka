import { isCalendarDate } from './onboardingValidation.js';
import { InternalError } from './internalAuthorization.js';
import { CONTENT_CATEGORY_DECISION } from './contentCategoryDecision.js';

const fail = code => { throw new InternalError(code, 409); };
export const PATTERN_HISTORY_LIMIT = 4000;
export function patternReader(client, owner) {
  const store = client.asServiceRole.entities;
  const checked = (rows, limit) => {
    if (!Array.isArray(rows) || rows.length > limit || new Set(rows.map(r => r.id)).size !== rows.length || rows.some(r => typeof r.id !== 'string' || !r.id)) fail('PATTERN_READ_FAILED');
    return rows;
  };
  return {
    async preferences() {
      const rows = checked(await store.UserPreferences.filter({ user_id: owner }, 'id', 2, 0, ['id', 'user_id', 'timezone']), 2);
      if (rows.length > 1 || rows.some(r => r.user_id !== owner)) fail('PATTERN_DATA_INVALID');
      return rows[0] || null;
    },
    async firstDay(end) {
      const rows = checked(await store.UserDailyMessage.filter({ user_id: owner, shinka_date: { $lte: end } }, 'shinka_date', 1, 0, ['id', 'user_id', 'shinka_date']), 1);
      if (rows.some(r => r.user_id !== owner || !isCalendarDate(r.shinka_date) || r.shinka_date > end)) fail('PATTERN_DATA_INVALID');
      return rows[0]?.shinka_date ?? null;
    },
    async history(start, end) {
      // One bounded field-selected request (SDK max 5000) avoids offset shifts.
      // The extra sentinel makes overflow an error, never a partial summary.
      const rows = checked(await store.UserDailyMessage.filter({ user_id: owner, shinka_date: { $gte: start, $lte: end } }, 'id', PATTERN_HISTORY_LIMIT + 1, 0,
        ['id', 'user_id', 'shinka_date', 'timezone', 'category_id', 'generated_at']), PATTERN_HISTORY_LIMIT);
      if (rows.some(r => r.user_id !== owner || r.shinka_date < start || r.shinka_date > end)) fail('PATTERN_DATA_INVALID');
      return rows;
    },
    async categories() {
      const rows = checked(await store.MessageCategoryLookup.filter({}, 'id', 7, 0, ['id', 'category_code', 'display_name_tr', 'display_name_en']), 6);
      if (rows.length !== 6 || new Set(rows.map(r => r.category_code)).size !== 6 || rows.some(row => {
        const expected = CONTENT_CATEGORY_DECISION.rows.find(c => c.category_code === row.category_code);
        return !expected || row.display_name_tr !== expected.display_name_tr || row.display_name_en !== expected.display_name_en;
      })) fail('PATTERN_CATEGORY_CONFLICT');
      return rows;
    },
    async moon(instant) {
      const start = new Date(instant.getTime() - 35 * 86400000).toISOString();
      const end = new Date(instant.getTime() + 35 * 86400000).toISOString();
      return checked(await store.MoonPhaseLookup.filter({ start_at_utc: { $lte: end }, end_at_utc: { $gte: start } }, 'start_at_utc', 33, 0, ['id', 'phase_code', 'start_at_utc', 'end_at_utc']), 32);
    },
  };
}

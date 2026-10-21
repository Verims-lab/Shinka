import { nativeFixture } from './nativeFixture';
import { dailyRecordFixture } from './dailyRecordFixture';
import { CONTENT_CATEGORY_DECISION } from '../../../base44/shared/contentCategoryDecision.js';
import { patternOperation } from '../../../base44/shared/patternOperation.js';
export const PATTERN_NOW = '2026-10-20T12:00:00.000Z';
export const patternRow = (date, category = 'category-0', id = date) => ({ ...dailyRecordFixture(id), shinka_date: date, category_id: category, generated_at: `${date}T09:00:00.000Z` });
export function patternFixture() {
  const f = nativeFixture({ granted: false });
  f.tables.UserDailyMessage = [];
  f.tables.MessageCategoryLookup = CONTENT_CATEGORY_DECISION.rows.map((row, i) => ({ id: `category-${i}`, category_code: row.category_code, display_name_tr: row.display_name_tr, display_name_en: row.display_name_en }));
  const dates = ['2026-10-01','2026-10-08','2026-10-17','2026-10-25','2026-11-01','2026-11-09','2026-11-17','2026-11-24','2026-12-01'];
  f.tables.MoonPhaseLookup = dates.slice(0, -1).map((day, i) => ({ id: `moon-${i}`, phase_code: ['NEW','WAXING','FULL','WANING'][i % 4], start_at_utc: `${day}T00:00:00.000Z`, end_at_utc: `${dates[i+1]}T00:00:00.000Z` }));
  f.state.time = PATTERN_NOW;
  return { ...f, request: (action, body = {}, owner = 'ownerA') => patternOperation(f.client(owner), { action, timezone: 'Europe/Istanbul', ...body }, { now: f.now }) };
}

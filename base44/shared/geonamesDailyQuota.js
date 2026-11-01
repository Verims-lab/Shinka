import { GeoNamesError } from './geonamesDiagnostics.js';

export const GEONAMES_DAILY_CAP = 8000;
export const GEONAMES_HOURLY_CAP = 800;
export const GEONAMES_QUOTA_SCOPE = 'APP_CREDITS_V1';
const HOUR = 3600000;
const unavailable = (code = 'GEONAMES_QUOTA_INVALID', stage = 'QUOTA_VALIDATION') => { throw new GeoNamesError(code, null, null, stage); };
const integer = value => Number.isSafeInteger(value) && value >= 0;

// Only the two reviewed endpoints are priced. A new endpoint needs an explicit
// credit decision; neither a caller-supplied cost nor "every request = 1" is used.
export function geoNamesCreditCost(input) {
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.hostname !== 'secure.geonames.org' || !['/searchJSON', '/getJSON'].includes(url.pathname)) unavailable();
  return 1;
}

function valid(row, hour) {
  if (!row || typeof row.id !== 'string' || !row.id || row.scope !== GEONAMES_QUOTA_SCOPE ||
      !integer(row.revision) || row.revision === Number.MAX_SAFE_INTEGER || !integer(row.window_hour) || row.window_hour > hour ||
      !Array.isArray(row.buckets) || row.buckets.length > 25) return false;
  const seen = new Set();
  return row.buckets.every(b => {
    if (!b || !integer(b.hour) || !integer(b.credits) || b.credits > GEONAMES_DAILY_CAP ||
        b.hour > row.window_hour || b.hour < row.window_hour - 24 || seen.has(b.hour)) return false;
    seen.add(b.hour); return true;
  });
}

// One operator-prepared row, never create/upsert on the request path. Missing,
// legacy-only or duplicate state fails closed, including concurrent first use.
// 25 UTC-hour buckets conservatively cover any trailing 24h; the newest two
// cover any trailing hour. UTC is bucketing, NOT a provider reset assumption.
// A single-ID conditional update is the documented Base44 reservation boundary.
// Local fixtures prove this algorithm against CAS, not hosted atomic enforcement.
export function createDailyQuota(store, { cap = GEONAMES_DAILY_CAP, hourlyCap = GEONAMES_HOURLY_CAP, now = () => Date.now() } = {}) {
  return async (credits = 1) => {
    if (!integer(credits) || credits < 1 || !integer(cap) || cap < 1 || cap > GEONAMES_DAILY_CAP ||
        !integer(hourlyCap) || hourlyCap < 1 || hourlyCap > GEONAMES_HOURLY_CAP) unavailable();
    let stage = 'QUOTA_READ';
    try {
      const time = now(), hour = Math.floor(time / HOUR);
      if (!integer(hour) || !Number.isFinite(time)) unavailable();
      const rows = await store.filter({ scope: GEONAMES_QUOTA_SCOPE }, 'id', 2, 0, ['id', 'scope', 'revision', 'window_hour', 'buckets']);
      if (Array.isArray(rows) && rows.length === 0) unavailable('GEONAMES_QUOTA_MISSING');
      if (!Array.isArray(rows) || rows.length !== 1 || !valid(rows[0], hour)) unavailable();
      const row = rows[0], buckets = row.buckets.filter(b => b.hour >= hour - 24);
      const windows = [{ age: 24, cap }, { age: 1, cap: hourlyCap }];
      let wait = 0;
      for (const window of windows) {
        const used = buckets.filter(b => b.hour >= hour - window.age).sort((a, b) => a.hour - b.hour);
        let total = used.reduce((sum, b) => sum + b.credits, 0);
        for (const b of used) {
          if (total + credits <= window.cap) break;
          wait = Math.max(wait, Math.ceil(((b.hour + window.age + 1) * HOUR - time) / 1000));
          total -= b.credits;
        }
        if (credits > window.cap) unavailable();
      }
      if (wait > 0) return wait;
      const current = buckets.find(b => b.hour === hour);
      const next = buckets.map(b => ({ ...b, credits: b.credits + (b === current ? credits : 0) }));
      if (!current) next.push({ hour, credits });
      stage = 'QUOTA_RESERVATION';
      const result = await store.updateMany(
        { id: row.id, scope: GEONAMES_QUOTA_SCOPE, revision: row.revision, window_hour: row.window_hour },
        { $set: { buckets: next, window_hour: hour }, $inc: { revision: 1 } },
      );
      // Never retry an unknown write. A lost response can waste credits but cannot
      // authorize a fetch. A verified non-match is contention; retry is user-led.
      if (result?.success !== true || result.has_more !== false || ![0, 1].includes(result.updated)) unavailable('GEONAMES_QUOTA_WRITE_UNCONFIRMED', stage);
      return result.updated === 1 ? null : 1;
    } catch (error) {
      if (error instanceof GeoNamesError) throw error;
      unavailable(stage === 'QUOTA_READ' ? 'GEONAMES_QUOTA_READ_FAILED' : 'GEONAMES_QUOTA_WRITE_UNCONFIRMED', stage);
    }
  };
}

// App-wide daily cap on real GeoNames provider calls, shared across workers via
// one counter row per UTC day. Increment uses $inc (no lost updates); two
// workers creating the first row of a day at once can briefly over-count by a
// few calls. A store failure propagates, so searches fail closed, not open.
export const GEONAMES_DAILY_CAP = 8000;

const rowsOf = result => (Array.isArray(result) ? result : result?.items ?? []);
const secondsToUtcMidnight = t => { const d = new Date(t); d.setUTCHours(24, 0, 0, 0); return Math.max(1, Math.ceil((d.getTime() - t) / 1000)); };

// store: service-scoped GeoNamesDailyQuota entity handle.
// Returns null when the call may proceed, else seconds until the cap resets.
export function createDailyQuota(store, { cap = GEONAMES_DAILY_CAP, now = () => Date.now() } = {}) {
  return async () => {
    const t = now(), day = new Date(t).toISOString().slice(0, 10);
    const row = rowsOf(await store.filter({ quota_date: day }, '-count', 1))[0];
    if (!row) { await store.create({ quota_date: day, count: 1 }); return null; }
    if (row.count >= cap) return secondsToUtcMidnight(t);
    await store.updateMany({ id: row.id }, { $inc: { count: 1 } });
    return null;
  };
}
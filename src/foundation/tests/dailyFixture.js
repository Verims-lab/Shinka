// Isolated fixtures; never native concurrency or live product evidence.
import { sdkOnboardingFixture } from './base44OnboardingFixture';
import { CATEGORY_COUNTS, SIGNS, MOONS, PHASES, UNKNOWN_PHASE } from '../../../base44/shared/contentArtifactValidator.ts';
import { contentBlueprint, planContentImport } from '../../../base44/shared/contentImportPlan.js';
export const DAILY_NOW = '2026-10-20T12:00:00.000Z';
export function contentFixture() {
  const labels = Object.keys(CATEGORY_COUNTS);
  let id = 0;
  const source = { sourceSet: 'SYNTHETIC_ONLY', sha256: 'synthetic-source',
    pairs: Object.entries(CATEGORY_COUNTS).flatMap(([label, count]) => Array.from({ length: count }, () => [`SHF-${String(++id).padStart(3, '0')}`, label, `TR fixture ${id}`, `TR suggestion ${id}`, `EN fixture ${id}`, `EN suggestion ${id}`])),
    mappings: SIGNS.flatMap(sun => MOONS.flatMap(moon => [...PHASES, UNKNOWN_PHASE].map((cycle, i) => [sun, moon, cycle, labels[i % 6]]))),
  };
  const decision = { status: 'APPROVED_PRODUCT_DECISION', rows: labels.map((source_label, i) => ({ source_label, category_code: `FIXTURE_${i}`, display_name_tr: `TR ${i}`, display_name_en: `EN ${i}` })) };
  return { source, decision, blueprint: contentBlueprint(source, decision) };
}
export function dailyFixture() {
  const f = sdkOnboardingFixture();
  f.rows.user_profile.push({ id: 'profile', user_id: 'ownerA', account_status: 'ACTIVE', display_name: 'Ada', birth_date: '1990-01-01', birth_time: null, sun_sign_code: 'CAPRICORN', birthplace_geonames_id: null, birthplace_name: null, birthplace_country_code: null, birthplace_latitude: null, birthplace_longitude: null });
  f.rows.user_preferences.push({ id: 'preferences', user_id: 'ownerA', language_code: 'tr', timezone: 'Europe/Istanbul', notifications_enabled: false, notification_time: '06:00' });
  f.rows.moon_phase_lookup.push({ id: 'moon', phase_code: 'NEW', start_at_utc: '2026-10-01T00:00:00Z', end_at_utc: '2026-11-01T00:00:00Z' });
  const { blueprint } = contentFixture();
  const ids = new Map();
  for (const [entity, entries] of Object.entries(blueprint)) for (const [i, entry] of entries.entries()) {
    const row = { ...entry.record, id: `${entity}-${i}` };
    if (entity === 'message_category_lookup') ids.set(`@category:${row.category_code}`, row.id);
    if (row.category_id) row.category_id = ids.get(row.category_id);
    f.rows[entity].push(row);
  }
  const atomic = {
    // In-memory executable protocol fixture ONLY. Both clients share this one
    // store to model a correct adapter. This does not certify Base44 primitives.
    createIfAbsent: async ({ record, requirements }) => {
      if (f.rows.user_profile[0]?.account_status !== 'ACTIVE') throw Object.assign(new Error(), { code: 'ACTIVE_ACCOUNT_REQUIRED' });
      if (requirements.healthInput && (f.rows.user_health_consent[0]?.granted_at !== requirements.healthInput.grantedAt || f.rows.user_health_consent[0]?.consent_status !== 'GRANTED' || f.rows.health_data_deletion_job.some(j => j.job_status !== 'COMPLETED'))) throw Object.assign(new Error(), { code: 'HEALTH_CONSENT_REQUIRED' });
      let saved = f.rows.user_daily_message.find(row => row.user_id === record.user_id && row.shinka_date === record.shinka_date);
      if (saved) return { id: saved.id, status: 'EXISTING' };
      saved = { id: `daily-${f.rows.user_daily_message.length + 1}`, ...record }; f.rows.user_daily_message.push(saved);
      return { id: saved.id, status: 'CREATED' };
    },
    read: async (_entity, id) => structuredClone(f.rows.user_daily_message.find(row => row.id === id)),
  };
  const library = async () => ({ plan: planContentImport(blueprint, f.rows), actual: f.rows });
  return { ...f, atomic, dependencies: { atomic, library, now: () => new Date(DAILY_NOW), random: () => 0 } };
}

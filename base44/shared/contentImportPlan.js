import { InternalError } from './internalAuthorization.js';
import { validateDomainRecord } from './domainValidation.js';
import { SUN_SIGN_CODES } from './domainSchemas.js';
import { SIGNS, MOONS, PHASES, UNKNOWN_PHASE } from './contentArtifactValidator.ts';
import { MOON_PHASE_ORDER } from './moonIntervals.js';

export const CONTENT_TABLES = Object.freeze(['message_category_lookup', 'message_pair', 'message_category_mapping']);
const TEXT_FIELDS = ['message_tr', 'suggestion_tr', 'message_en', 'suggestion_en'];
export function contentBlueprint(source, decision) {
  if (decision.status !== 'APPROVED_PRODUCT_DECISION' || decision.rows.length !== 6) throw new InternalError('CONTENT_CATEGORY_DECISION_REQUIRED', 503);
  const categories = decision.rows.map(({ source_label, ...record }) => ({ key: source_label, record: validateDomainRecord('message_category_lookup', record) }));
  const category = label => {
    const found = categories.filter(row => row.key === label);
    if (found.length !== 1) throw new InternalError('CONTENT_CATEGORY_CONFLICT', 409);
    return `@category:${found[0].record.category_code}`;
  };
  const pairs = source.pairs.map(([id, label, ...texts]) => ({ key: id, record: validateDomainRecord('message_pair', {
    category_id: category(label), ...Object.fromEntries(TEXT_FIELDS.map((field, index) => [field, texts[index]])), is_active: 'Active',
  }) }));
  const mappings = source.mappings.map(([sun, moon, cycle, label]) => {
    const record = validateDomainRecord('message_category_mapping', {
      sun_sign_code: SUN_SIGN_CODES[SIGNS.indexOf(sun)], moon_phase_code: MOON_PHASE_ORDER[MOONS.indexOf(moon)],
      cycle_phase_code: [...['MENSTRUAL', 'FOLLICULAR', 'OVULATION', 'LUTEAL'], 'UNKNOWN'][[...PHASES, UNKNOWN_PHASE].indexOf(cycle)], category_id: category(label),
    });
    return { key: `${record.sun_sign_code}/${record.moon_phase_code}/${record.cycle_phase_code}`, record };
  });
  return { message_category_lookup: categories, message_pair: pairs, message_category_mapping: mappings };
}
const identity = (entity, record) => JSON.stringify(entity === 'message_category_lookup' ? [record.category_code] : entity === 'message_pair' ? TEXT_FIELDS.map(field => record[field]) : [record.sun_sign_code, record.moon_phase_code, record.cycle_phase_code]);

// Exact copy matching produces the source Pair ID → native ID crosswalk without
// adding an unapproved product field or replacing platform-generated IDs.
export function planContentImport(blueprint, actual) {
  const categories = new Map();
  const conflicts = [];
  const missing = [];
  const same = [];
  const pairIds = [];
  for (const entity of CONTENT_TABLES) {
    const rows = actual[entity] || [];
    const index = new Map();
    for (const row of rows) {
      const key = identity(entity, row);
      index.set(key, [...(index.get(key) || []), row]);
    }
    const expectedKeys = new Set();
    for (const entry of blueprint[entity]) {
      const record = { ...entry.record };
      if (record.category_id) record.category_id = categories.get(record.category_id) || record.category_id;
      const key = identity(entity, record);
      expectedKeys.add(key);
      const matches = index.get(key) || [];
      const match = matches[0];
      const item = { entity, key: entry.key, record };
      if (!matches.length) missing.push(item);
      else if (matches.length !== 1 || !match.id || Object.entries(record).some(([field, value]) => match[field] !== value)) conflicts.push({ entity, key: entry.key, reason: matches.length > 1 ? 'DUPLICATE' : 'VALUE_MISMATCH' });
      else {
        same.push({ entity, key: entry.key, id: match.id });
        if (entity === 'message_category_lookup') categories.set(`@category:${record.category_code}`, match.id);
        if (entity === 'message_pair') pairIds.push({ source_pair_id: entry.key, platform_id: match.id });
      }
    }
    if (rows.some(row => !expectedKeys.has(identity(entity, row)))) conflicts.push({ entity, key: null, reason: 'UNRECOGNIZED_ROW' });
    if (new Set(rows.map(row => row.id)).size !== rows.length) conflicts.push({ entity, key: null, reason: 'DUPLICATE_NATIVE_ID' });
  }
  return { missing, same, conflicts, pairIds, ready: missing.length === 0 && conflicts.length === 0 };
}
export async function contentDigest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)))), byte => byte.toString(16).padStart(2, '0')).join('');
}

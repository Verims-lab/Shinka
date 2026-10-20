import { InternalError } from './internalAuthorization.js';
import { generateMoonIntervals, validateMoonIntervals } from './moonIntervals.js';
import { contentDigest } from './contentImportPlan.js';
import { SYSTEM_AUTHORITIES, assertProtectedRecordMutationAllowed } from './domainSecurity.js';

export async function inspectMoonImport(client, astronomy, now = new Date()) {
  // Stable monthly coverage horizon; repeated dry-runs do not create new event times.
  const horizon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const expected = generateMoonIntervals(astronomy, horizon);
  const actual = await client.asServiceRole.entities.MoonPhaseLookup.filter({}, 'start_at_utc', 1201, 0, ['id', 'phase_code', 'start_at_utc', 'end_at_utc']);
  if (!Array.isArray(actual) || actual.length > 1200) throw new InternalError('MOON_LOOKUP_SIZE_CONFLICT', 409);
  const conflicts = [], missing = [];
  for (const row of expected) {
    const matches = actual.filter(other => other.start_at_utc === row.start_at_utc);
    if (!matches.length) missing.push(row);
    else if (matches.length !== 1 || Object.keys(row).some(key => matches[0][key] !== row[key])) conflicts.push(row.start_at_utc);
  }
  // Reject malformed/overlapping older records as well; partial sequential imports
  // may have a missing tail, but gaps inside an existing run are not silently filled.
  if (actual.length) validateMoonIntervals(actual);
  const ready = !conflicts.length && !missing.length;
  if (ready) validateMoonIntervals(actual, now, new Date(Date.UTC(horizon.getUTCFullYear() + 2, horizon.getUTCMonth(), 1)));
  return { missing, summary: { ready, create: missing.length, same: expected.length - missing.length - conflicts.length, conflicts,
    astronomyVersion: '2.1.19', generatedAt: now.toISOString(),
    coverageStart: expected[0].start_at_utc, coverageEnd: expected.at(-1).end_at_utc,
    digest: await contentDigest({ version: '2.1.19', expected, actual }) } };
}
export async function applyMoonBatch(client, inspection, digest) {
  if (digest !== inspection.summary.digest) throw new InternalError('CONTENT_REVIEW_EXPIRED', 409);
  if (inspection.summary.conflicts.length) throw new InternalError('MOON_LOOKUP_CONFLICT', 409);
  assertProtectedRecordMutationAllowed('moon_phase_lookup', 'create', SYSTEM_AUTHORITIES.REFERENCE);
  const batch = inspection.missing.slice(0, 25);
  if (batch.length) await client.asServiceRole.entities.MoonPhaseLookup.upsert(batch, { key: Object.keys(batch[0]) });
  return batch.length;
}

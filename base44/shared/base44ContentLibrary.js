import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';
import { InternalError } from './internalAuthorization.js';
import { CONTENT_TABLES, contentBlueprint, planContentImport, contentDigest } from './contentImportPlan.js';
import { assertProtectedRecordMutationAllowed, SYSTEM_AUTHORITIES } from './domainSecurity.js';

const LIMITS = { message_category_lookup: 7, message_pair: 261, message_category_mapping: 241 };
export async function inspectContentLibrary(client, source, decision) {
  const blueprint = contentBlueprint(source, decision);
  const actual = {};
  for (const entity of CONTENT_TABLES) {
    const fields = ['id', ...Object.keys(DOMAIN_SCHEMAS[entity].properties)];
    actual[entity] = await client.asServiceRole.entities[physicalName(entity)].filter({}, 'id', LIMITS[entity], 0, fields);
    if (!Array.isArray(actual[entity]) || actual[entity].length >= LIMITS[entity]) throw new InternalError('CONTENT_LIBRARY_SIZE_CONFLICT', 409);
  }
  const plan = planContentImport(blueprint, actual);
  const digest = await contentDigest({ sourceHash: source.sha256, decision, actual });
  return { plan, actual, digest, sourceHash: source.sha256, sourceSet: source.sourceSet };
}
export function librarySummary(inspection) {
  const { plan, digest, sourceHash, sourceSet } = inspection;
  return { phase: plan.ready ? 'VERIFIED_IMPORTED' : plan.conflicts.length ? 'CONFLICT' : plan.same.length ? 'PARTIAL_IMPORT' : 'PRE_IMPORT',
    ready: plan.ready, digest, sourceHash, sourceSet,
    counts: Object.fromEntries(CONTENT_TABLES.map(entity => [entity, { create: plan.missing.filter(row => row.entity === entity).length, same: plan.same.filter(row => row.entity === entity).length, conflicts: plan.conflicts.filter(row => row.entity === entity).length }])),
    conflicts: plan.conflicts, pairIds: plan.pairIds };
}
// Explicit admin apply only. One bounded batch; retry starts with fresh read/dry-run.
// Full-value upsert is insert-or-identical: it cannot edit existing product copy.
// Base44 offers no distributed uniqueness. Concurrent import operators are not
// supported; duplicates fail verification and are never silently repaired.
export async function applyContentBatch(client, inspection, reviewedDigest) {
  if (reviewedDigest !== inspection.digest) throw new InternalError('CONTENT_REVIEW_EXPIRED', 409);
  if (inspection.plan.conflicts.length) throw new InternalError('CONTENT_IMPORT_CONFLICT', 409);
  const pending = inspection.plan.missing.filter(row => !String(row.record.category_id).startsWith('@category:')).slice(0, 25);
  for (const entity of CONTENT_TABLES) {
    const records = pending.filter(row => row.entity === entity).map(row => row.record);
    if (!records.length) continue;
    assertProtectedRecordMutationAllowed(entity, 'create', SYSTEM_AUTHORITIES.REFERENCE);
    await client.asServiceRole.entities[physicalName(entity)].upsert(records, { key: Object.keys(records[0]) });
  }
  return { attempted: pending.length }; // Not success/readback until a fresh full inspection.
}

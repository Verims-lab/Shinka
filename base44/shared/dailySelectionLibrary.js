import { contentBlueprint } from './contentImportPlan.js';
import { validateDomainRecord } from './domainValidation.js';
import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';
import { InternalError } from './internalAuthorization.js';

// Import verification remains exact-source. Runtime selection validates IDs,
// approved categories/mappings and eligibility without downloading every text.
export async function readDailySelectionLibrary(client, source, decision) {
  const blueprint = contentBlueprint(source, decision), actual = {}, categories = new Map();
  for (const entity of ['message_category_lookup', 'message_category_mapping', 'message_pair']) {
    const fields = entity === 'message_pair' ? ['category_id', 'is_active'] : Object.keys(DOMAIN_SCHEMAS[entity].properties);
    const expected = blueprint[entity].length;
    const rows = await client.asServiceRole.entities[physicalName(entity)].filter({}, 'id', expected + 1, 0, ['id', ...fields]);
    if (!Array.isArray(rows) || rows.length !== expected || new Set(rows.map(row => row.id)).size !== rows.length || rows.some(row => typeof row.id !== 'string' || !row.id.trim())) throw new InternalError('CONTENT_NOT_READY', 503);
    if (entity === 'message_pair') {
      if (rows.some(row => ![...categories.values()].includes(row.category_id) || !['Active', 'Inactive'].includes(row.is_active))) throw new InternalError('CONTENT_MAPPING_CONFLICT', 409);
    } else {
      const remaining = [...rows];
      for (const entry of blueprint[entity]) {
        const expectedRecord = { ...entry.record };
        if (expectedRecord.category_id) expectedRecord.category_id = categories.get(expectedRecord.category_id);
        const index = remaining.findIndex(row => Object.entries(expectedRecord).every(([key, value]) => row[key] === value));
        if (index < 0) throw new InternalError('CONTENT_MAPPING_CONFLICT', 409);
        const [row] = remaining.splice(index, 1);
        validateDomainRecord(entity, Object.fromEntries(fields.map(key => [key, row[key]])));
        if (entity === 'message_category_lookup') categories.set(`@category:${row.category_code}`, row.id);
      }
    }
    actual[entity] = rows;
  }
  return { plan: { ready: true }, actual }; // Runtime readiness, not an import receipt.
}

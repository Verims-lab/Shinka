import { DOMAIN_SCHEMAS } from './domainSchemas.js';
import { InternalError } from './internalAuthorization.js';
import { assertOwner } from './domainSecurity.js';
import { normalizeDomainRead } from './domainValidation.js';

const PAGE_LIMIT = 100;
// This endpoint is a bounded view, never a complete-history/export API. Fetch
// one sentinel and disclose truncation; feature readers own their pagination.
export async function readDomainPage(api, entity, query, principal, shared) {
  const fields = ['id', ...Object.keys(DOMAIN_SCHEMAS[entity].properties), 'created_date', 'updated_date'];
  const rows = await api.filter(query, '-created_date', PAGE_LIMIT + 1, 0, fields);
  if (!Array.isArray(rows) || rows.length > PAGE_LIMIT + 1 || rows.some(row => !row || typeof row.id !== 'string' || !row.id) || new Set(rows.map(row => row.id)).size !== rows.length)
    throw new InternalError('DOMAIN_READ_INVALID', 503);
  // Check the sentinel too: slicing must never conceal an owner mismatch.
  if (!shared) rows.forEach(row => assertOwner(principal, row));
  return { records: rows.slice(0, PAGE_LIMIT).map(row => normalizeDomainRead(entity, row)), truncated: rows.length > PAGE_LIMIT };
}

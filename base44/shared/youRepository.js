import { InternalError } from './internalAuthorization.js';
import { assertOwner, SYSTEM_AUTHORITIES, assertProtectedRecordMutationAllowed } from './domainSecurity.js';
import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';
import { normalizeDomainRead, validateDomainRecord } from './domainValidation.js';

export const profileFields = Object.freeze(['display_name', 'birth_date', 'birth_time', 'birthplace_geonames_id', 'birthplace_name', 'birthplace_country_code', 'birthplace_latitude', 'birthplace_longitude', 'sun_sign_code']);
export const preferenceFields = Object.freeze(['language_code', 'notifications_enabled', 'notification_time', 'timezone', 'theme_code']);
export const pickFields = (row, fields) => Object.fromEntries(fields.map(key => [key, row[key] ?? null]));
export const sameFields = (row, expected) => Object.entries(expected).every(([key, value]) => (row[key] ?? null) === value);
export async function youRevision(row, fields) {
  const bytes = new TextEncoder().encode(JSON.stringify([row.id, row.updated_at, pickFields(row, fields)]));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function youRepository(client, principal) {
  const store = client.asServiceRole.entities, owner = principal.id;
  const read = async entity => {
    const rows = await store[physicalName(entity)].filter({ user_id: owner }, 'id', 2);
    if (!Array.isArray(rows)) throw new InternalError('YOU_READ_FAILED', 503);
    rows.forEach(row => assertOwner(principal, row));
    if (rows.length > 1) throw new InternalError('DUPLICATE_OWNER_STATE', 409);
    if (!rows.length) return null;
    const row = normalizeDomainRead(entity, rows[0]);
    validateDomainRecord(entity, pickFields(row, Object.keys(DOMAIN_SCHEMAS[entity].properties)));
    if (!row.id) throw new InternalError('YOU_READ_FAILED', 503);
    return row;
  };
  const update = async (entity, before, desired, admit) => {
    assertProtectedRecordMutationAllowed(entity, 'update', SYSTEM_AUTHORITIES.PROFILE);
    await admit(true);
    // Filtered native update plus exact readback detects observable races. This
    // is not a transaction or a documented linearizable compare-and-swap.
    const fields = entity === 'user_profile' ? profileFields : preferenceFields;
    /** @type {Record<string, any>} */
    const query = { id: before.id, user_id: owner, ...pickFields(before, fields) };
    if (entity === 'user_profile') query.account_status = 'ACTIVE';
    if (before.updated_at != null) query.updated_date = before.updated_at;
    let result;
    try { result = await store[physicalName(entity)].updateMany(query, { $set: desired }); }
    catch { throw new InternalError('YOU_WRITE_UNCONFIRMED', 503); }
    if (result?.success !== true || result.updated !== 1 || result.has_more === true) throw new InternalError('YOU_WRITE_UNCONFIRMED', 409);
    try {
      await admit(true);
      const saved = await read(entity);
      if (!saved || saved.id !== before.id || !sameFields(saved, desired)) throw new InternalError('YOU_WRITE_UNCONFIRMED', 409);
      return saved;
    } catch (error) { throw Object.assign(error, { writeUnconfirmed: true }); }
  };
  return { read, update };
}
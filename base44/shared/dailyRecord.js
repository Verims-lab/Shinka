import { InternalError } from './internalAuthorization.js';
import { DOMAIN_SCHEMAS } from './domainSchemas.js';
import { validateDomainRecord } from './domainValidation.js';
/** @returns {Record<string, any>} */
export function verifiedDailyRecord(row, owner, day = null) {
  if (typeof row?.id !== 'string' || !row.id.trim() || row.user_id !== owner || day && row.shinka_date !== day) throw new InternalError('DAILY_READBACK_CONFLICT', 409);
  const record = validateDomainRecord('user_daily_message', Object.fromEntries(Object.keys(DOMAIN_SCHEMAS.user_daily_message.properties).map(key => [key, row[key]])));
  return { id: row.id, ...record };
}

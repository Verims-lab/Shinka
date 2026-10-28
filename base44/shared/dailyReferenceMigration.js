// Operator-only offline bundle; no HTTP route or scheduled execution. Never
// writes assignments, creates rows, copies text, or changes retention scopes.
import { InternalError, requireInternalAdmin } from './internalAuthorization.js';
import { withUserLifecycle } from './userLifecycle.js';
import { createTestRepository } from './adminTestRepository.js';
import { assertPrivacyAccess, privacyHash } from './privacyPolicy.js';
import { verifiedDailyRecord } from './dailyRecord.js';
import { DOMAIN_SCHEMAS } from './domainSchemas.js';
import { DAILY_TEXT_FIELDS, LEGACY_DAILY_TEXT_FIELDS } from './dailyContent.js';
export const DAILY_MIGRATION_LIMIT = 25;
const fields = ['id', ...Object.keys(DOMAIN_SCHEMAS.user_daily_message.properties)];
const select = [...fields, 'updated_date', ...LEGACY_DAILY_TEXT_FIELDS];
const fail = code => { throw new InternalError(code, 409); };
const identity = row => Object.fromEntries(fields.map(key => [key, row[key]]));
const present = row => LEGACY_DAILY_TEXT_FIELDS.filter(key => Object.hasOwn(row, key));
const same = (a,b) => JSON.stringify(identity(a)) === JSON.stringify(identity(b));
async function admit(client) {
  const actor = await requireInternalAdmin(withUserLifecycle(client));
  const rows = await client.asServiceRole.entities.UserProfile.filter({ user_id: actor.id }, 'id', 2, 0, ['id','user_id','account_status']);
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0].user_id !== actor.id || rows[0].account_status !== 'ACTIVE') fail('ACTIVE_ACCOUNT_REQUIRED');
}
async function inspect(client, { cursor = null, ids = null }) {
  if (cursor !== null && (typeof cursor !== 'string' || !cursor.trim())) fail('MIGRATION_INPUT_INVALID');
  if (ids && (!Array.isArray(ids) || !ids.length || ids.length > DAILY_MIGRATION_LIMIT || new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string' || !id.trim()))) fail('MIGRATION_INPUT_INVALID');
  const store = client.asServiceRole.entities;
  const query = ids ? { id: { $in: ids } } : cursor ? { id: { $gt: cursor } } : {};
  const rows = await store.UserDailyMessage.filter(query, 'id', DAILY_MIGRATION_LIMIT + 1, 0, select);
  if (!Array.isArray(rows) || rows.length > DAILY_MIGRATION_LIMIT + 1 || new Set(rows.map(r=>r.id)).size !== rows.length || rows.some(r=>typeof r.id !== 'string' || !r.id || ids && !ids.includes(r.id) || !ids && cursor && r.id <= cursor)) fail('MIGRATION_READ_INVALID');
  if (ids && (rows.length !== ids.length || rows.some((r,i)=>r.id !== [...ids].sort()[i]))) fail('MIGRATION_REVIEW_EXPIRED');
  const page = rows.slice(0, DAILY_MIGRATION_LIMIT);
  const pairIds = [...new Set(page.map(row=>row.message_pair_id).filter(id=>typeof id === 'string' && id.trim()))];
  const pairs = pairIds.length ? await store.MessagePair.filter({id:{$in:pairIds}}, 'id', pairIds.length+1, 0, ['id',...DAILY_TEXT_FIELDS]) : [];
  if (!Array.isArray(pairs) || pairs.length > pairIds.length || new Set(pairs.map(p=>p.id)).size !== pairs.length || pairs.some(p=>!pairIds.includes(p.id))) fail('MIGRATION_REFERENCE_READ_INVALID');
  const reports = page.map(row=>{
    let status = 'READY';
    try { verifiedDailyRecord(row,row.user_id); } catch { status = 'ASSIGNMENT_INVALID'; }
    const pair = pairs.find(p=>p.id===row.message_pair_id);
    if (status === 'READY' && (!pair || DAILY_TEXT_FIELDS.some(key=>typeof pair[key]!=='string'||!pair[key].trim()))) status = pair ? 'REFERENCE_INVALID' : 'REFERENCE_MISSING';
    return {id:row.id, status, legacyFields:present(row).length};
  });
  const digest = await privacyHash(JSON.stringify({contract:'daily-reference/1',rows:page, references:reports.map(r=>[r.id,r.status])}));
  return {page, report:{ids:page.map(r=>r.id),reviewed_digest:digest,rows:reports,hasMore:rows.length>DAILY_MIGRATION_LIMIT,nextCursor:page.at(-1)?.id||cursor,clean:reports.every(r=>r.status==='READY'&&r.legacyFields===0)}};
}
export async function dailyReferenceMigration(client, body) {
  if (!body || !['dryRun','applyBatch','verify'].includes(body.action) || Object.keys(body).some(k=>!['action','cursor','ids','reviewed_digest'].includes(k))) fail('MIGRATION_INPUT_INVALID');
  await admit(client);
  if (body.action !== 'applyBatch') return (await inspect(client,body)).report;
  if (!body.ids || body.cursor || !/^[a-f0-9]{64}$/.test(body.reviewed_digest || '')) fail('MIGRATION_REVIEW_REQUIRED');
  const initial = await inspect(client,{ids:body.ids});
  if (initial.report.reviewed_digest !== body.reviewed_digest) fail('MIGRATION_REVIEW_EXPIRED');
  const outcomes = [], repository = createTestRepository(client), store = client.asServiceRole.entities.UserDailyMessage;
  for (const row of initial.page) {
    const report = initial.report.rows.find(r=>r.id===row.id);
    if (report.status !== 'READY') { outcomes.push({id:row.id,status:report.status}); continue; }
    try {
      await admit(client);
      await assertPrivacyAccess(client,row.user_id);
      if (await repository.lifecycle(row.user_id)) fail('MIGRATION_TARGET_BUSY');
      const current = await store.filter({id:row.id},'id',2,0,select);
      if (!Array.isArray(current) || current.length !== 1 || !same(row,current[0])) fail('MIGRATION_REVIEW_EXPIRED');
      const fresh = current[0];
      if (present(fresh).length) {
        // Literal native ID + reviewed assignment predicates: no bulk $in write.
        // Recheck is a documented platform contract, not a transaction claim.
        if (JSON.stringify(fresh) !== JSON.stringify(row)) fail('MIGRATION_REVIEW_EXPIRED');
        const predicate = {...identity(row), ...(row.updated_date ? {updated_date:row.updated_date} : {})};
        try { await store.updateMany(predicate, {$unset:Object.fromEntries(LEGACY_DAILY_TEXT_FIELDS.map(k=>[k,'']))}); }
        catch { /* Lost acknowledgement: success only if independent readback proves absence. */ }
      }
      const result = await store.filter({id:row.id},'id',2,0,select);
      if (!Array.isArray(result) || result.length!==1 || !same(row,result[0]) || present(result[0]).length) fail('MIGRATION_READBACK_UNCONFIRMED');
      outcomes.push({id:row.id,status:'VERIFIED_CLEAN'});
    } catch (error) {
      outcomes.push({id:row.id,status:error instanceof InternalError ? error.code : 'MIGRATION_IO_UNCONFIRMED'});
      // A partial pass stops here. Re-dry-run this same ID set after recovery;
      // already absent fields are durable checkpoints, never rewritten.
      break;
    }
  }
  return {outcomes,pendingIds:body.ids.filter(id=>!outcomes.some(r=>r.id===id&&r.status==='VERIFIED_CLEAN')),complete:outcomes.length===body.ids.length&&outcomes.every(r=>r.status==='VERIFIED_CLEAN')};
}

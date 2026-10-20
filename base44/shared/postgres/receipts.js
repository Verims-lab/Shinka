import { hashToolValue } from '../adminTestPolicy.js';
import { sqlFail } from './store.js';
const stable = value => Array.isArray(value)?value.map(stable):value&&typeof value==='object'
  ? Object.fromEntries(Object.keys(value).sort().filter(k=>k!=='action_id').map(k=>[k,stable(value[k])])):value;
export const requestFingerprint = body => hashToolValue(stable(body));
export async function receipt(context,id,operation,fingerprint,perform) {
  const {sql,appId,actor}=context;
  const rows=await sql`SELECT * FROM shinka_private.request_receipt WHERE app_id=${appId} AND user_id=${actor.user_id}
    AND generation=${actor.generation} AND request_id=${id}`;
  if(rows.length) {
    if(rows[0].operation!==operation||rows[0].fingerprint!==fingerprint)sqlFail('ACTION_CONFLICT');
    return {replayed:true,result:rows[0].result};
  }
  const result=await perform();
  await sql`INSERT INTO shinka_private.request_receipt(app_id,user_id,generation,request_id,operation,fingerprint,result)
    VALUES(${appId},${actor.user_id},${actor.generation},${id},${operation},${fingerprint},${sql.json(result)})`;
  return {replayed:false,result};
}

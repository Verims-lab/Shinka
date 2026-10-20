import { DOMAIN_SCHEMAS, physicalName, IMMUTABLE_ENTITIES } from '../domainSchemas.js';
import { validateDomainRecord } from '../domainValidation.js';
import { InternalError } from '../internalAuthorization.js';

export const DERIVED_ENTITIES = Object.freeze(['user_cycle_prediction', 'user_cycle_phase_day']);
export const sqlFail = (code, status = 409) => { throw new InternalError(code, status); };
export const sqlTable = (sql, entity) => sql(`shinka_private.${entity}`);
const metadata = ['id','created_at','updated_at'];
const normalize = row => row && Object.fromEntries(Object.entries(row).filter(([key])=>key!=='app_id').map(([key,value])=>[key,value instanceof Date?value.toISOString():value]));
const aliases = row => row && ({...row,created_date:row.created_at,updated_date:row.updated_at});

// A request-scoped repository on the transaction connection. Never a network
// Entity shim/fallback: every product query below is parameterized PostgreSQL.
export function createSqlStore(sql, appId) {
  const spec = entity => DOMAIN_SCHEMAS[entity] || sqlFail('INVALID_DOMAIN_ENTITY',400);
  const field = (entity, key) => {
    const mapped = {created_date:'created_at',updated_date:'updated_at'}[key] || key;
    if (!metadata.includes(mapped) && !Object.hasOwn(spec(entity).properties,mapped)) sqlFail('INVALID_SQL_QUERY',400);
    return sql(mapped);
  };
  const where = (entity, query) => {
    const terms = [sql`app_id=${appId}`];
    for (const [key,value] of Object.entries(query)) {
      if(key==='$or') {
        if(!Array.isArray(value)||!value.length||value.length>10)sqlFail('INVALID_SQL_QUERY',400);
        const items=value.map(q=>where(entity,q));
        terms.push(sql`(${items.reduce((a,b)=>sql`${a} OR ${b}`)})`);continue;
      }
      const col=field(entity,key);
      if(value!==null && typeof value==='object') {
        for(const [op,arg] of Object.entries(value)) {
          if(op==='$in' && Array.isArray(arg) && arg.length<=1000)terms.push(arg.length?sql`${col} IN ${sql(arg)}`:sql`false`);
          else if(op==='$ne')terms.push(arg===null?sql`${col} IS NOT NULL`:sql`${col} <> ${arg}`);
          else if(op==='$gte')terms.push(sql`${col} >= ${arg}`);
          else if(op==='$lte')terms.push(sql`${col} <= ${arg}`);
          else sqlFail('INVALID_SQL_QUERY',400);
        }
      } else terms.push(value===null?sql`${col} IS NULL`:sql`${col}=${value}`);
    }
    return terms.reduce((a,b)=>sql`${a} AND ${b}`);
  };
  const read = async (entity,query={},sort='id',limit=100,offset=0,fields=null) => {
    if(DERIVED_ENTITIES.includes(entity))sqlFail('DERIVED_PROJECTION_REQUIRED');
    if(!Number.isSafeInteger(limit)||limit<0||limit>20001||!Number.isSafeInteger(offset)||offset<0)sqlFail('INVALID_SQL_QUERY',400);
    const column=field(entity,sort.replace(/^-/,''));
    const order=sort.startsWith('-')?sql`DESC`:sql`ASC`;
    const selected=fields?fields.map(key=>field(entity,key)):null;
    const rows=await sql`SELECT ${selected?sql(fields.map(key=>({created_date:'created_at',updated_date:'updated_at'}[key]||key))):sql`*`}
      FROM ${sqlTable(sql,entity)} WHERE ${where(entity,query)} ORDER BY ${column} ${order},id LIMIT ${limit} OFFSET ${offset}`;
    return rows.map(row=>aliases(normalize(row)));
  };
  const record = (entity, data) => {
    const valid=validateDomainRecord(entity,data);
    return Object.fromEntries(Object.keys(spec(entity).properties).map(key=>[key,valid[key]??null]));
  };
  const insert = async (entity,data,id=crypto.randomUUID()) => {
    const row={app_id:appId,id,...record(entity,data)};
    const [saved]=await sql`INSERT INTO ${sqlTable(sql,entity)} ${sql(row)} RETURNING *`;
    return aliases(normalize(saved));
  };
  const update = async (entity,id,patch) => {
    if(IMMUTABLE_ENTITIES.includes(entity))sqlFail('IMMUTABLE_RECORD');
    const before=(await read(entity,{id},'id',1))[0];if(!before)sqlFail('REFERENCE_NOT_FOUND');
    const input=Object.fromEntries(Object.keys(spec(entity).properties).map(key=>[key,before[key]]));
    const row={...record(entity,{...input,...patch}),updated_at:new Date().toISOString()};
    const [saved]=await sql`UPDATE ${sqlTable(sql,entity)} SET ${sql(row)} WHERE app_id=${appId} AND id=${id} RETURNING *`;
    return aliases(normalize(saved));
  };
  const remove = async (entity,id) => {
    if(IMMUTABLE_ENTITIES.includes(entity))sqlFail('IMMUTABLE_RECORD');
    await sql`DELETE FROM ${sqlTable(sql,entity)} WHERE app_id=${appId} AND id=${id}`;
  };
  const upsert = async (entity,values,{key}) => {
    const keys=Array.isArray(key)?key:[key], result=[];
    for(const data of values) {
      const expected=record(entity,data);
      const rows=await read(entity,Object.fromEntries(keys.map(k=>[k,expected[k]])),'id',2);
      if(rows.length>1)sqlFail('DUPLICATE_OWNER_STATE');
      if(rows.length) {
        if(Object.entries(expected).some(([k,v])=>(rows[0][k]??null)!==v))sqlFail('WRITE_CONFLICT');
        result.push(rows[0]);
      } else result.push(await insert(entity,expected));
    }
    return result;
  };
  const entities=Object.fromEntries(Object.keys(DOMAIN_SCHEMAS).filter(e=>!DERIVED_ENTITIES.includes(e)).map(entity=>[physicalName(entity),{
    filter:(...args)=>read(entity,...args),list:(sort,limit,offset,fields)=>read(entity,{},sort,limit,offset,fields),
    get:async id=>(await read(entity,{id},'id',1))[0]??sqlFail('REFERENCE_NOT_FOUND',404),
    count:async()=>Number((await sql`SELECT count(*) AS n FROM ${sqlTable(sql,entity)} WHERE app_id=${appId}`)[0].n),
    create:data=>insert(entity,data),update:(id,patch)=>update(entity,id,patch),delete:id=>remove(entity,id),
    upsert:(values,options)=>upsert(entity,values,options),
    updateMany:async(query,patch)=>{
      const rows=await read(entity,query,'id',20001);for(const row of rows)await update(entity,row.id,patch.$set);
      return {updated:rows.length};
    },
  }]));
  return {sql,appId,read,record,insert,update,remove,upsert,entities};
}

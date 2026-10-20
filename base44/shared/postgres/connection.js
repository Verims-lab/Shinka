import { sqlFail } from './store.js';
export function postgresOptions(url,{local=false,ca=null}={}) {
  let parsed;try{parsed=new URL(url);}catch{sqlFail('SQL_AUTHORITY_NOT_CONFIGURED',503);}
  if(!['postgres:','postgresql:'].includes(parsed.protocol)||!parsed.username||!parsed.hostname)sqlFail('SQL_AUTHORITY_NOT_CONFIGURED',503);
  const loopback=['127.0.0.1','localhost','[::1]'].includes(parsed.hostname);
  if(local&&!loopback||!local&&loopback)sqlFail('SQL_DESTINATION_INVALID',503);
  // Never use sslmode=require/no-verify from a URI to weaken certificate checks.
  if(parsed.search)sqlFail('SQL_CONNECTION_OPTIONS_DENIED',503);
  return {max:1,max_pipeline:1,prepare:false,connect_timeout:10,idle_timeout:5,max_lifetime:60,
    ssl:local?false:{rejectUnauthorized:true,...(ca?{ca}:{})},
    types:{
      date:{to:1082,from:[1082],serialize:value=>value,parse:value=>value},
      timestamp:{to:1184,from:[1184],serialize:value=>value,parse:value=>new Date(value).toISOString()},
    },
    onnotice:()=>{}, // No SQL payloads/native diagnostics in application logs.
  };
}

// One explicit pool per active warm-worker configuration; this is connection
// accounting, never a substitute for SQL locks. Secrets are read every request.
export function createPoolScope(factory) {
  let current=null;
  return (url,options)=>{
    const signature=JSON.stringify([url,options.ssl]);
    if(current&&current.signature!==signature)sqlFail('SQL_CONFIGURATION_ROTATING',503);
    if(!current)current={signature,pool:factory(url,options),users:0};
    const lease=current;lease.users++;let released=false;
    return {pool:lease.pool,close:async()=>{
      if(released)return;released=true;lease.users--;
      if(!lease.users){current=null;await lease.pool.end({timeout:2});}
    }};
  };
}

import fs from 'node:fs/promises';
import postgres from 'postgres';
import {postgresOptions} from '../../../base44/shared/postgres/connection.js';
import {createSqlRuntime} from '../../../base44/shared/postgres/runtime.js';
import {createPreviewSigner} from '../../../base44/shared/adminTestPreview.js';
export const NOW='2026-10-20T12:00:00.000Z';
export const APP='synthetic-sql-test';
export const IDS=['admin','admin2','plain','inactive','onboarding','partial','daily','calendar','reset','delete','delete2','crash','spacing','no-consent','skip','daily-process','reset-failure','withdrawn','open-job','rollback-calendar','timestamps','delete3'].map(s=>`synthetic-${s}`);
export const key='synthetic-preview-only-never-a-real-secret-015';
export const makePool=url=>postgres(url,postgresOptions(url,{local:true}));
export function nativeClient(actor,identities,options={}) {
  return {auth:{me:async()=>({id:actor,role:options.nativeRole||'admin'})},
    getConfig:()=>({appId:APP,serverUrl:'https://synthetic.invalid'}),asServiceRole:{integrations:{},entities:{
      User:{filter:async({id})=>(JSON.parse(await fs.readFile(identities,'utf8'))).includes(id)?[{id}]:[],
        delete:async id=>{const ids=JSON.parse(await fs.readFile(identities,'utf8'));await fs.writeFile(identities,JSON.stringify(ids.filter(x=>x!==id)));if(options.loseNativeDeleteResponse)throw new Error('SYNTHETIC_LOST_NATIVE_RESPONSE');}},
      // No Base44 product entity is present: fallback/dual writes cannot pass.
    }}};
}
export function makeRuntime(pool,actor,identities,options={}) {
  return createSqlRuntime(pool,nativeClient(actor,identities,options),{appId:APP,allowedPrincipals:IDS,now:()=>new Date(NOW),
    signer:createPreviewSigner(key,()=>new Date(NOW)),allowTestTools:true,...options});
}
export const actionId=()=>crypto.randomUUID();
export async function ready(runtime) {
  await runtime.execute('onboarding',{action:'initialize',language_code:'en',timezone:'Europe/Istanbul',action_id:actionId()});
  await runtime.execute('onboarding',{action:'saveProfile',birth_date:'1990-03-21',action_id:actionId()});
}
export const cycleBody=()=>({action:'saveCycle',action_id:actionId(),period_start_date:'2026-10-01',period_duration_days:null,initial_cycle_length_days:null,health_consent:true});
export async function execution(runtime,target,operation) {
  const preview=await runtime.execute('adminTestTools',{action:'preview',target_id:target,operation});
  if(!preview.enabled)throw new Error(`PREVIEW_BLOCKED:${preview.blockers.join(',')}`);
  return {action:'execute',target_id:target,operation,confirmation:target,request_id:actionId(),preview_token:preview.preview_token};
}

import postgres from 'npm:postgres@3.4.9';
import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {secrets} from 'base44:runtime';
import {postgresOptions,createPoolScope} from './connection.js';
import {createSqlRuntime} from './runtime.js';
import {sqlFail} from './store.js';
import {createPreviewSigner} from '../adminTestPreview.js';

const acquirePool=createPoolScope(postgres);

// Server-only. Missing/mismatched Test configuration never selects legacy data.
export async function openHostedSql(req,options={}) {
  const client=createClientFromRequest(req),appId=secrets.get('SHINKA_SQL_APP_ID');
  if(!appId||client.getConfig().appId!==appId||secrets.get('SHINKA_SQL_ENVIRONMENT')!=='TEST')sqlFail('SQL_AUTHORITY_NOT_CONFIGURED',503);
  let allowedPrincipals;
  try{allowedPrincipals=JSON.parse(secrets.get('SHINKA_SQL_TEST_PRINCIPALS')||'null');}catch{sqlFail('SQL_TEST_SCOPE_REQUIRED',503);}
  if(!Array.isArray(allowedPrincipals)||!allowedPrincipals.length||allowedPrincipals.some(id=>typeof id!=='string'||!id||id.length>128))sqlFail('SQL_TEST_SCOPE_REQUIRED',503);
  const url=secrets.get('SHINKA_DATABASE_URL');
  const lease=acquirePool(url,postgresOptions(url,{ca:secrets.get('SHINKA_DATABASE_CA')||null}));
  return {runtime:createSqlRuntime(lease.pool,client,{...options,appId,allowedPrincipals,
    allowTestTools:secrets.get('SHINKA_SQL_TEST_TOOLS')==='SYNTHETIC_ONLY',
    signer:createPreviewSigner(secrets.get('ADMIN_TEST_TOOLS_PREVIEW_KEY'))}),close:lease.close};
}

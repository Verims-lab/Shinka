import postgres from 'postgres';
import {createClient} from '@base44/sdk';
import {postgresOptions} from '../../base44/shared/postgres/connection.js';
import {bootstrapAdmin} from './bootstrapAdmin.mjs';
let pool;
try {
  const appId=process.env.SHINKA_SQL_APP_ID,confirmedUserId=process.env.SHINKA_CONFIRMED_ADMIN_USER_ID;
  const allowedPrincipals=JSON.parse(process.env.SHINKA_SQL_TEST_PRINCIPALS||'null');
  const url=process.env.SHINKA_OPERATOR_DATABASE_URL,projectRef=process.env.SHINKA_CONFIRMED_TEST_PROJECT_REF,parsed=new URL(url);
  if(process.env.SHINKA_SQL_ENVIRONMENT!=='TEST'||!appId||!projectRef||!Array.isArray(allowedPrincipals)||
    !(parsed.hostname===`db.${projectRef}.supabase.co`||parsed.hostname.endsWith('.pooler.supabase.com')&&decodeURIComponent(parsed.username).endsWith(`.${projectRef}`)))throw new Error('TEST_DESTINATION_CONFIRMATION_REQUIRED');
  if(!process.env.SHINKA_BOOTSTRAP_USER_TOKEN||!process.env.SHINKA_BOOTSTRAP_SERVICE_TOKEN)throw new Error('BOOTSTRAP_IDENTITY_ACCESS_REQUIRED');
  const client=createClient({appId,token:process.env.SHINKA_BOOTSTRAP_USER_TOKEN,serviceToken:process.env.SHINKA_BOOTSTRAP_SERVICE_TOKEN});
  pool=postgres(url,postgresOptions(url,{ca:process.env.SHINKA_DATABASE_CA||null}));
  console.log(JSON.stringify(await bootstrapAdmin(pool,client,{appId,confirmedUserId,allowedPrincipals})));
} catch(error) {
  console.error(/^BOOTSTRAP_[A-Z_]+$/.test(error.message)?error.message:'TEST_ADMIN_BOOTSTRAP_FAILED');process.exitCode=1;
} finally {if(pool)await pool.end();}

import postgres from 'postgres';
import {postgresOptions} from '../../base44/shared/postgres/connection.js';
import {migrate,grantRuntimeRole} from './migrate.mjs';
import {prepareReferenceData} from './referenceData.mjs';
// Run only after the operator verifies the destination in the Supabase dashboard.
// No provisioning, plan upgrade, native user import or product-data migration.
const environment=process.env.SHINKA_SQL_ENVIRONMENT,appId=process.env.SHINKA_SQL_APP_ID;
const confirmedRef=process.env.SHINKA_CONFIRMED_TEST_PROJECT_REF,url=process.env.SHINKA_OPERATOR_DATABASE_URL;
let pool;
try {
  if(environment!=='TEST'||!appId||!confirmedRef)throw new Error('TEST_DESTINATION_CONFIRMATION_REQUIRED');
  const parsed=new URL(url);
  const projectBound=parsed.hostname===`db.${confirmedRef}.supabase.co`||parsed.hostname.endsWith('.pooler.supabase.com')&&decodeURIComponent(parsed.username).endsWith(`.${confirmedRef}`);
  if(!projectBound)throw new Error('TEST_DATABASE_PROJECT_MISMATCH');
  pool=postgres(url,postgresOptions(url,{ca:process.env.SHINKA_DATABASE_CA||null}));
  const migration=await migrate(pool);await grantRuntimeRole(pool);
  await pool`INSERT INTO shinka_private.application(app_id,environment) VALUES(${appId},'TEST') ON CONFLICT DO NOTHING`;
  const reference=await prepareReferenceData(pool,appId);
  console.log(JSON.stringify({scope:'CONFIRMED_TEST_ONLY',migration,reference}));
} catch(error) {
  // Native errors can include credentials/statements. Emit an allowlisted code only.
  const known=['TEST_DESTINATION_CONFIRMATION_REQUIRED','TEST_DATABASE_PROJECT_MISMATCH','MIGRATION_DIGEST_MISMATCH','REFERENCE_MANIFEST_MISMATCH','TEST_DESTINATION_REQUIRED','REFERENCE_READBACK_CONFLICT'];
  console.error(known.includes(error.message)?error.message:'TEST_PREPARATION_FAILED');process.exitCode=1;
} finally {if(pool)await pool.end();}

import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function migrate(pool) {
  const sqlText=await fs.readFile(new URL('../../postgres/migrations/001_test_authority.sql',import.meta.url),'utf8');
  const digest=createHash('sha256').update(sqlText).digest('hex');
  return pool.begin(async sql=>{
    await sql`SELECT pg_advisory_xact_lock(781542003)`;
    await sql`CREATE TABLE IF NOT EXISTS public.shinka_migration(version integer PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT clock_timestamp())`;
    await sql`REVOKE ALL ON public.shinka_migration FROM PUBLIC`;
    const before=await sql`SELECT sha256 FROM public.shinka_migration WHERE version=1`;
    if(before.length){if(before[0].sha256!==digest)throw new Error('MIGRATION_DIGEST_MISMATCH');return {version:1,digest,applied:false};}
    await sql.unsafe(sqlText); // Reviewed checked-in SQL, never a request or env value.
    await sql`INSERT INTO public.shinka_migration(version,sha256) VALUES(1,${digest})`;
    return {version:1,digest,applied:true};
  });
}
export async function grantRuntimeRole(sql) {
  // Operator-only bootstrap. Password creation/rotation stays outside this file.
  await sql`DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='shinka_runtime')
    THEN CREATE ROLE shinka_runtime NOLOGIN NOBYPASSRLS; END IF; END $$`;
  await sql`GRANT USAGE ON SCHEMA shinka_private TO shinka_runtime`;
  await sql`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA shinka_private TO shinka_runtime`;
  await sql`REVOKE INSERT,UPDATE,DELETE ON shinka_private.application FROM shinka_runtime`;
  await sql`GRANT UPDATE(app_id) ON shinka_private.application TO shinka_runtime`;
  await sql`REVOKE UPDATE,DELETE ON shinka_private.user_daily_message,shinka_private.user_health_consent_event,shinka_private.admin_audit_log FROM shinka_runtime`;
}

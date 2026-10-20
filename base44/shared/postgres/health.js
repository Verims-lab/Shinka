// Read-only connection/schema diagnostics. No identity, URL, payload or credential.
export async function sqlAuthorityStatus({sql,appId}) {
  const [app]=await sql`SELECT environment,authority_version,reference_hash,admin_bootstrapped_at IS NOT NULL AS admin_bootstrapped FROM shinka_private.application WHERE app_id=${appId}`;
  const [role]=await sql`SELECT rolbypassrls,rolsuper FROM pg_roles WHERE rolname=current_user`;
  const tables=await sql`SELECT c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='shinka_private' AND c.relkind='r'`;
  const constraints=await sql`SELECT c.contype,count(*)::int AS count FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='shinka_private' GROUP BY c.contype`;
  return {scope:'CONNECTED_POSTGRESQL_READ_ONLY',authority:'POSTGRESQL_TEST_V1',environment:app.environment,version:app.authority_version,
    referenceHash:app.reference_hash,adminBootstrapped:app.admin_bootstrapped,
    runtimeRoleRestricted:!role.rolbypassrls&&!role.rolsuper,tables:tables.length,rlsTables:tables.filter(t=>t.relrowsecurity).length,
    constraints:Object.fromEntries(constraints.map(row=>[row.contype,row.count])),
    hostedMutationAcceptance:false,checkedAt:new Date().toISOString()};
}

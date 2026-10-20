// Reviewed physical schema generated from the canonical domain fields.
// Run explicitly when authoring a new migration; never from application startup.
import fs from 'node:fs/promises';
import { DOMAIN_SCHEMAS, IMMUTABLE_ENTITIES } from '../../base44/shared/domainSchemas.js';
import { RELATIONSHIPS } from '../../base44/shared/domainContract.js';
export const DERIVED = ['user_cycle_prediction', 'user_cycle_phase_day'];
const literal = value => `'${String(value).replaceAll("'", "''")}'`;
const out = ['-- Shinka PostgreSQL authority v1. Test only. No real-user data or credentials.',
  'CREATE SCHEMA shinka_private;',
  'REVOKE ALL ON SCHEMA shinka_private FROM PUBLIC;',
  `CREATE TABLE shinka_private.application (
    app_id text PRIMARY KEY, environment text NOT NULL CHECK (environment = 'TEST'),
    authority_version integer NOT NULL DEFAULT 1 CHECK (authority_version = 1),
    reference_hash text, admin_bootstrapped_at timestamptz, created_at timestamptz NOT NULL DEFAULT clock_timestamp()
  );`,
  `CREATE TABLE shinka_private.owner (
    app_id text NOT NULL REFERENCES shinka_private.application, user_id text NOT NULL,
    is_admin boolean NOT NULL DEFAULT false, generation bigint NOT NULL DEFAULT 0, identity_verified_at timestamptz NOT NULL,
    deletion_fenced_at timestamptz, PRIMARY KEY(app_id,user_id)
  );`,
  `CREATE TABLE shinka_private.request_receipt (
    app_id text NOT NULL, user_id text NOT NULL, generation bigint NOT NULL, request_id text NOT NULL, operation text NOT NULL,
    fingerprint text NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY(app_id,user_id,generation,request_id), FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner
  );`,
  `CREATE TABLE shinka_private.test_operation (
    app_id text NOT NULL, id text NOT NULL, operation_id text NOT NULL, actor_id text NOT NULL, target_id text NOT NULL,
    operation text NOT NULL CHECK(operation IN ('RESET_ONBOARDING','DELETE_USER')),
    status text NOT NULL CHECK(status IN ('RUNNING','RETRY_REQUIRED','AUDIT_PENDING','RESET_ACTIVE','COMPLETED')),
    stage text NOT NULL, request_id text NOT NULL CHECK(request_id = operation_id), preview_hash text NOT NULL,
    started_at timestamptz NOT NULL, progressed_at timestamptz NOT NULL, completed_at timestamptz,
    error_code text, checkpoints jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(checkpoints)='array'),
    PRIMARY KEY(app_id,id), UNIQUE(app_id,operation_id),
    FOREIGN KEY(app_id,actor_id) REFERENCES shinka_private.owner(app_id,user_id),
    FOREIGN KEY(app_id,target_id) REFERENCES shinka_private.owner(app_id,user_id)
  );`,
  `CREATE UNIQUE INDEX one_target_lifecycle ON shinka_private.test_operation(app_id,target_id)
    WHERE status <> 'COMPLETED' OR operation = 'DELETE_USER';`,
  `CREATE FUNCTION shinka_private.reject_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'IMMUTABLE_RECORD' USING ERRCODE='23514'; END $$;`,
];
for (const [entity, spec] of Object.entries(DOMAIN_SCHEMAS)) {
  if (DERIVED.includes(entity)) continue; // Computed by the shared engine from one locked snapshot.
  const fields = ['app_id text NOT NULL REFERENCES shinka_private.application', 'id text NOT NULL',
    'created_at timestamptz NOT NULL DEFAULT clock_timestamp()', 'updated_at timestamptz NOT NULL DEFAULT clock_timestamp()'];
  for (const [name, field] of Object.entries(spec.properties)) {
    const type = field.type === 'integer' ? 'integer' : field.type === 'number' ? 'double precision' :
      field.type === 'boolean' ? 'boolean' : field.format === 'date' ? 'date' : field.format === 'date-time' ? 'timestamptz' : 'text';
    const checks = [];
    if (field.enum) checks.push(`${name} IN (${field.enum.map(literal).join(',')})`);
    if (field.minimum !== undefined) checks.push(`${name} >= ${field.minimum}`);
    if (field.maximum !== undefined) checks.push(`${name} <= ${field.maximum}`);
    if (field.minLength) checks.push(`length(${name}) >= ${field.minLength}`);
    if (field.maxLength) checks.push(`length(${name}) <= ${field.maxLength}`);
    if (field.pattern) checks.push(`${name} ~ ${literal(field.pattern)}`);
    fields.push(`${name} ${type}${spec.required.includes(name) ? ' NOT NULL' : ''}${checks.length ? ` CHECK (${checks.join(' AND ')})` : ''}`);
  }
  fields.push('PRIMARY KEY(app_id,id)');
  if (spec.properties.user_id) fields.push('UNIQUE(app_id,id,user_id)', 'FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id)');
  for (const unique of spec.unique) fields.push(`UNIQUE(app_id,${unique.join(',')})`);
  if (entity === 'message_pair') fields.push('UNIQUE(app_id,id,category_id)');
  if (entity === 'user_period_record') fields.push('UNIQUE(app_id,user_id,period_start_date)');
  if (entity === 'user_health_consent_event') fields.push('UNIQUE(app_id,user_id,event_type,consent_version,occurred_at)');
  if (entity === 'moon_phase_lookup') fields.push('UNIQUE(app_id,start_at_utc)', 'CHECK(end_at_utc > start_at_utc)');
  if (entity === 'user_health_consent') fields.push(`CHECK (
    (consent_status='GRANTED' AND granted_at IS NOT NULL AND withdrawn_at IS NULL) OR
    (consent_status='WITHDRAWN' AND granted_at IS NOT NULL AND withdrawn_at IS NOT NULL AND withdrawn_at >= granted_at))`);
  out.push(`CREATE TABLE shinka_private.${entity} (\n  ${fields.join(',\n  ')}\n);`);
}
for (const { from, to } of RELATIONSHIPS) {
  const [child, field] = from.split('.'), [parent] = to.split('.');
  if (DERIVED.includes(child) || field === 'user_id') continue;
  const owned = DOMAIN_SCHEMAS[child].properties.user_id && DOMAIN_SCHEMAS[parent]?.properties.user_id;
  const target = parent === 'User' ? 'owner' : parent;
  const targetId = parent === 'User' ? 'user_id' : 'id';
  out.push(`ALTER TABLE shinka_private.${child} ADD FOREIGN KEY(app_id,${field}${owned ? ',user_id' : ''}) REFERENCES shinka_private.${target}(app_id,${targetId}${owned ? ',user_id' : ''}) DEFERRABLE INITIALLY DEFERRED;`);
}
out.push(`ALTER TABLE shinka_private.user_daily_message ADD FOREIGN KEY(app_id,message_pair_id,category_id)
  REFERENCES shinka_private.message_pair(app_id,id,category_id);`,
`CREATE UNIQUE INDEX one_open_health_deletion ON shinka_private.health_data_deletion_job(app_id,user_id) WHERE job_status <> 'COMPLETED';`,
`CREATE INDEX period_owner_date ON shinka_private.user_period_record(app_id,user_id,period_start_date);`,
`CREATE INDEX daily_owner_date ON shinka_private.user_daily_message(app_id,user_id,shinka_date);`,
`CREATE FUNCTION shinka_private.guard_period_spacing() RETURNS trigger LANGUAGE plpgsql AS $$
  BEGIN
    PERFORM 1 FROM shinka_private.owner WHERE app_id=NEW.app_id AND user_id=NEW.user_id FOR UPDATE;
    IF EXISTS(SELECT 1 FROM shinka_private.user_period_record
      WHERE app_id=NEW.app_id AND user_id=NEW.user_id AND id<>NEW.id AND abs(period_start_date-NEW.period_start_date)<15)
      THEN RAISE EXCEPTION 'PERIOD_CONFLICT' USING ERRCODE='23514'; END IF;
    RETURN NEW;
  END $$;`,
`CREATE TRIGGER period_spacing BEFORE INSERT OR UPDATE ON shinka_private.user_period_record FOR EACH ROW EXECUTE FUNCTION shinka_private.guard_period_spacing();`);
for (const entity of IMMUTABLE_ENTITIES) out.push(`CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON shinka_private.${entity} FOR EACH ROW EXECUTE FUNCTION shinka_private.reject_immutable();`);
// Even a leaked Supabase browser key has no path into this private schema.
for (const entity of ['application','owner','request_receipt','test_operation',...Object.keys(DOMAIN_SCHEMAS).filter(e=>!DERIVED.includes(e))]) {
  out.push(`ALTER TABLE shinka_private.${entity} ENABLE ROW LEVEL SECURITY;`);
  out.push(`CREATE POLICY tenant_server ON shinka_private.${entity} USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));`);
}
out.push('REVOKE ALL ON ALL TABLES IN SCHEMA shinka_private FROM PUBLIC;',
  'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA shinka_private FROM PUBLIC;');
out.push(`DO $$ DECLARE browser_role text; BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=browser_role) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA shinka_private FROM %I',browser_role);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA shinka_private FROM %I',browser_role);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA shinka_private FROM %I',browser_role);
    END IF;
  END LOOP;
END $$;`);
await fs.mkdir('postgres/migrations', { recursive: true });
await fs.writeFile('postgres/migrations/001_test_authority.sql', out.join('\n\n') + '\n');

-- Shinka PostgreSQL authority v1. Test only. No real-user data or credentials.

CREATE SCHEMA shinka_private;

REVOKE ALL ON SCHEMA shinka_private FROM PUBLIC;

CREATE TABLE shinka_private.application (
    app_id text PRIMARY KEY, environment text NOT NULL CHECK (environment = 'TEST'),
    authority_version integer NOT NULL DEFAULT 1 CHECK (authority_version = 1),
    reference_hash text, admin_bootstrapped_at timestamptz, created_at timestamptz NOT NULL DEFAULT clock_timestamp()
  );

CREATE TABLE shinka_private.owner (
    app_id text NOT NULL REFERENCES shinka_private.application, user_id text NOT NULL,
    is_admin boolean NOT NULL DEFAULT false, generation bigint NOT NULL DEFAULT 0, identity_verified_at timestamptz NOT NULL,
    deletion_fenced_at timestamptz, PRIMARY KEY(app_id,user_id)
  );

CREATE TABLE shinka_private.request_receipt (
    app_id text NOT NULL, user_id text NOT NULL, generation bigint NOT NULL, request_id text NOT NULL, operation text NOT NULL,
    fingerprint text NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY(app_id,user_id,generation,request_id), FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner
  );

CREATE TABLE shinka_private.test_operation (
    app_id text NOT NULL, id text NOT NULL, operation_id text NOT NULL, actor_id text NOT NULL, target_id text NOT NULL,
    operation text NOT NULL CHECK(operation IN ('RESET_ONBOARDING','DELETE_USER')),
    status text NOT NULL CHECK(status IN ('RUNNING','RETRY_REQUIRED','AUDIT_PENDING','RESET_ACTIVE','COMPLETED')),
    stage text NOT NULL, request_id text NOT NULL CHECK(request_id = operation_id), preview_hash text NOT NULL,
    started_at timestamptz NOT NULL, progressed_at timestamptz NOT NULL, completed_at timestamptz,
    error_code text, checkpoints jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(checkpoints)='array'),
    PRIMARY KEY(app_id,id), UNIQUE(app_id,operation_id),
    FOREIGN KEY(app_id,actor_id) REFERENCES shinka_private.owner(app_id,user_id),
    FOREIGN KEY(app_id,target_id) REFERENCES shinka_private.owner(app_id,user_id)
  );

CREATE UNIQUE INDEX one_target_lifecycle ON shinka_private.test_operation(app_id,target_id)
    WHERE status <> 'COMPLETED' OR operation = 'DELETE_USER';

CREATE FUNCTION shinka_private.reject_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'IMMUTABLE_RECORD' USING ERRCODE='23514'; END $$;

CREATE TABLE shinka_private.user_profile (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  display_name text CHECK (length(display_name) <= 50),
  birth_date date NOT NULL,
  birth_time text CHECK (birth_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  birthplace_geonames_id double precision,
  birthplace_name text CHECK (length(birthplace_name) >= 1),
  birthplace_country_code text CHECK (length(birthplace_country_code) >= 2 AND length(birthplace_country_code) <= 2),
  birthplace_latitude double precision CHECK (birthplace_latitude >= -90 AND birthplace_latitude <= 90),
  birthplace_longitude double precision CHECK (birthplace_longitude >= -180 AND birthplace_longitude <= 180),
  sun_sign_code text CHECK (sun_sign_code IN ('ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES')),
  account_status text NOT NULL CHECK (account_status IN ('ACTIVE','INACTIVE')),
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id),
  UNIQUE(app_id,user_id)
);

CREATE TABLE shinka_private.user_preferences (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  language_code text NOT NULL CHECK (language_code IN ('tr','en')),
  notifications_enabled boolean NOT NULL,
  notification_time text NOT NULL CHECK (notification_time IN ('06:00') AND notification_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  timezone text NOT NULL CHECK (length(timezone) >= 1),
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id),
  UNIQUE(app_id,user_id)
);

CREATE TABLE shinka_private.user_health_consent (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  consent_status text NOT NULL CHECK (consent_status IN ('GRANTED','WITHDRAWN')),
  consent_version text NOT NULL CHECK (length(consent_version) >= 1),
  granted_at timestamptz,
  withdrawn_at timestamptz,
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id),
  UNIQUE(app_id,user_id),
  CHECK (
    (consent_status='GRANTED' AND granted_at IS NOT NULL AND withdrawn_at IS NULL) OR
    (consent_status='WITHDRAWN' AND granted_at IS NOT NULL AND withdrawn_at IS NOT NULL AND withdrawn_at >= granted_at))
);

CREATE TABLE shinka_private.user_health_consent_event (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  event_type text NOT NULL CHECK (event_type IN ('GRANTED','WITHDRAWN')),
  consent_version text NOT NULL CHECK (length(consent_version) >= 1),
  occurred_at timestamptz NOT NULL,
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id),
  UNIQUE(app_id,user_id,event_type,consent_version,occurred_at)
);

CREATE TABLE shinka_private.user_cycle_settings (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  period_duration_days integer CHECK (period_duration_days >= 1 AND period_duration_days <= 10),
  initial_cycle_length_days integer CHECK (initial_cycle_length_days >= 15 AND initial_cycle_length_days <= 60),
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id),
  UNIQUE(app_id,user_id)
);

CREATE TABLE shinka_private.user_period_record (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  period_start_date date NOT NULL,
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id),
  UNIQUE(app_id,user_id,period_start_date)
);

CREATE TABLE shinka_private.cycle_phase_lookup (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  cycle_length_days integer NOT NULL CHECK (cycle_length_days >= 15 AND cycle_length_days <= 60),
  period_duration_days integer NOT NULL CHECK (period_duration_days >= 1 AND period_duration_days <= 10),
  cycle_day integer NOT NULL CHECK (cycle_day >= 1 AND cycle_day <= 60),
  phase_code text NOT NULL CHECK (phase_code IN ('MENSTRUAL','FOLLICULAR','OVULATION','LUTEAL')),
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,cycle_length_days,period_duration_days,cycle_day)
);

CREATE TABLE shinka_private.message_category_lookup (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  category_code text NOT NULL CHECK (length(category_code) >= 1),
  display_name_tr text NOT NULL CHECK (length(display_name_tr) >= 1),
  display_name_en text NOT NULL CHECK (length(display_name_en) >= 1),
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,category_code)
);

CREATE TABLE shinka_private.message_category_mapping (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  sun_sign_code text NOT NULL CHECK (sun_sign_code IN ('ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES')),
  moon_phase_code text NOT NULL CHECK (moon_phase_code IN ('NEW','WAXING','FULL','WANING')),
  cycle_phase_code text NOT NULL CHECK (cycle_phase_code IN ('MENSTRUAL','FOLLICULAR','OVULATION','LUTEAL','UNKNOWN')),
  category_id text NOT NULL CHECK (length(category_id) >= 1),
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,sun_sign_code,moon_phase_code,cycle_phase_code)
);

CREATE TABLE shinka_private.message_pair (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  category_id text NOT NULL CHECK (length(category_id) >= 1),
  message_tr text NOT NULL CHECK (length(message_tr) >= 1),
  suggestion_tr text NOT NULL CHECK (length(suggestion_tr) >= 1),
  message_en text NOT NULL CHECK (length(message_en) >= 1),
  suggestion_en text NOT NULL CHECK (length(suggestion_en) >= 1),
  is_active text NOT NULL CHECK (is_active IN ('Active')),
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,category_id)
);

CREATE TABLE shinka_private.user_daily_message (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  shinka_date date NOT NULL,
  timezone text NOT NULL CHECK (length(timezone) >= 1),
  category_id text NOT NULL CHECK (length(category_id) >= 1),
  message_pair_id text NOT NULL CHECK (length(message_pair_id) >= 1),
  message_tr_snapshot text NOT NULL CHECK (length(message_tr_snapshot) >= 1),
  suggestion_tr_snapshot text NOT NULL CHECK (length(suggestion_tr_snapshot) >= 1),
  message_en_snapshot text NOT NULL CHECK (length(message_en_snapshot) >= 1),
  suggestion_en_snapshot text NOT NULL CHECK (length(suggestion_en_snapshot) >= 1),
  generated_at timestamptz NOT NULL,
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id),
  UNIQUE(app_id,user_id,shinka_date)
);

CREATE TABLE shinka_private.notification_delivery (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  daily_message_id text NOT NULL CHECK (length(daily_message_id) >= 1),
  notification_type text NOT NULL CHECK (notification_type IN ('DAILY_SHINKA')),
  scheduled_at timestamptz NOT NULL,
  delivery_status text NOT NULL CHECK (delivery_status IN ('PENDING','SENT','FAILED','SKIPPED')),
  attempt_count integer NOT NULL CHECK (attempt_count >= 0),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  error_code text CHECK (length(error_code) >= 1),
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id),
  UNIQUE(app_id,daily_message_id,notification_type)
);

CREATE TABLE shinka_private.user_pattern_summary (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  as_of_date date NOT NULL,
  timezone text NOT NULL CHECK (length(timezone) >= 1),
  primary_category_id text CHECK (length(primary_category_id) >= 1),
  primary_count integer CHECK (primary_count >= 1),
  secondary_category_id text CHECK (length(secondary_category_id) >= 1),
  secondary_count integer CHECK (secondary_count >= 1),
  window_start_date date NOT NULL,
  window_end_date date NOT NULL,
  calculated_at timestamptz NOT NULL,
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id),
  UNIQUE(app_id,user_id)
);

CREATE TABLE shinka_private.moon_phase_lookup (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  phase_code text NOT NULL CHECK (phase_code IN ('NEW','WAXING','FULL','WANING')),
  start_at_utc timestamptz NOT NULL,
  end_at_utc timestamptz NOT NULL,
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,start_at_utc),
  CHECK(end_at_utc > start_at_utc)
);

CREATE TABLE shinka_private.admin_audit_log (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  admin_user_id text NOT NULL CHECK (length(admin_user_id) >= 1),
  target_user_id text CHECK (length(target_user_id) >= 1),
  target_entity text NOT NULL CHECK (length(target_entity) >= 1),
  target_record_id text CHECK (length(target_record_id) >= 1),
  action_type text NOT NULL CHECK (action_type IN ('VIEW','UPDATE','DELETE')),
  action_status text NOT NULL CHECK (action_status IN ('SUCCESS','FAILED')),
  performed_at timestamptz NOT NULL,
  error_code text CHECK (length(error_code) >= 1),
  PRIMARY KEY(app_id,id)
);

CREATE TABLE shinka_private.system_error_log (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  error_code text NOT NULL CHECK (length(error_code) >= 1),
  process_name text NOT NULL CHECK (length(process_name) >= 1),
  severity text NOT NULL CHECK (severity IN ('INFO','WARNING','ERROR','CRITICAL')),
  error_status text NOT NULL CHECK (error_status IN ('OPEN','RETRYING','RESOLVED')),
  retry_count integer NOT NULL CHECK (retry_count >= 0),
  last_retry_at timestamptz,
  resolved_at timestamptz,
  alert_sent_at timestamptz,
  correlation_id text NOT NULL CHECK (length(correlation_id) >= 1),
  PRIMARY KEY(app_id,id)
);

CREATE TABLE shinka_private.health_data_deletion_job (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  protection_event_id text NOT NULL CHECK (length(protection_event_id) >= 1),
  job_status text NOT NULL CHECK (job_status IN ('PENDING','PROCESSING','RETRYING','COMPLETED','FAILED')),
  requested_at timestamptz NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  retry_count integer NOT NULL CHECK (retry_count >= 0),
  last_retry_at timestamptz,
  error_code text CHECK (length(error_code) >= 1),
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id)
);

CREATE TABLE shinka_private.data_protection_event (
  app_id text NOT NULL REFERENCES shinka_private.application,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  user_id text NOT NULL CHECK (length(user_id) >= 1),
  event_type text NOT NULL CHECK (event_type IN ('HEALTH_DATA_DELETION','ACCOUNT_DEACTIVATION')),
  event_status text NOT NULL CHECK (event_status IN ('PENDING','COMPLETED','FAILED')),
  requested_at timestamptz NOT NULL,
  completed_at timestamptz,
  PRIMARY KEY(app_id,id),
  UNIQUE(app_id,id,user_id),
  FOREIGN KEY(app_id,user_id) REFERENCES shinka_private.owner(app_id,user_id)
);

ALTER TABLE shinka_private.message_category_mapping ADD FOREIGN KEY(app_id,category_id) REFERENCES shinka_private.message_category_lookup(app_id,id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE shinka_private.message_pair ADD FOREIGN KEY(app_id,category_id) REFERENCES shinka_private.message_category_lookup(app_id,id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE shinka_private.user_daily_message ADD FOREIGN KEY(app_id,message_pair_id) REFERENCES shinka_private.message_pair(app_id,id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE shinka_private.user_daily_message ADD FOREIGN KEY(app_id,category_id) REFERENCES shinka_private.message_category_lookup(app_id,id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE shinka_private.notification_delivery ADD FOREIGN KEY(app_id,daily_message_id,user_id) REFERENCES shinka_private.user_daily_message(app_id,id,user_id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE shinka_private.health_data_deletion_job ADD FOREIGN KEY(app_id,protection_event_id,user_id) REFERENCES shinka_private.data_protection_event(app_id,id,user_id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE shinka_private.admin_audit_log ADD FOREIGN KEY(app_id,admin_user_id) REFERENCES shinka_private.owner(app_id,user_id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE shinka_private.admin_audit_log ADD FOREIGN KEY(app_id,target_user_id) REFERENCES shinka_private.owner(app_id,user_id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE shinka_private.user_pattern_summary ADD FOREIGN KEY(app_id,primary_category_id) REFERENCES shinka_private.message_category_lookup(app_id,id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE shinka_private.user_pattern_summary ADD FOREIGN KEY(app_id,secondary_category_id) REFERENCES shinka_private.message_category_lookup(app_id,id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE shinka_private.user_daily_message ADD FOREIGN KEY(app_id,message_pair_id,category_id)
  REFERENCES shinka_private.message_pair(app_id,id,category_id);

CREATE UNIQUE INDEX one_open_health_deletion ON shinka_private.health_data_deletion_job(app_id,user_id) WHERE job_status <> 'COMPLETED';

CREATE INDEX period_owner_date ON shinka_private.user_period_record(app_id,user_id,period_start_date);

CREATE INDEX daily_owner_date ON shinka_private.user_daily_message(app_id,user_id,shinka_date);

CREATE FUNCTION shinka_private.guard_period_spacing() RETURNS trigger LANGUAGE plpgsql AS $$
  BEGIN
    PERFORM 1 FROM shinka_private.owner WHERE app_id=NEW.app_id AND user_id=NEW.user_id FOR UPDATE;
    IF EXISTS(SELECT 1 FROM shinka_private.user_period_record
      WHERE app_id=NEW.app_id AND user_id=NEW.user_id AND id<>NEW.id AND abs(period_start_date-NEW.period_start_date)<15)
      THEN RAISE EXCEPTION 'PERIOD_CONFLICT' USING ERRCODE='23514'; END IF;
    RETURN NEW;
  END $$;

CREATE TRIGGER period_spacing BEFORE INSERT OR UPDATE ON shinka_private.user_period_record FOR EACH ROW EXECUTE FUNCTION shinka_private.guard_period_spacing();

CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON shinka_private.user_daily_message FOR EACH ROW EXECUTE FUNCTION shinka_private.reject_immutable();

CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON shinka_private.user_health_consent_event FOR EACH ROW EXECUTE FUNCTION shinka_private.reject_immutable();

CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON shinka_private.admin_audit_log FOR EACH ROW EXECUTE FUNCTION shinka_private.reject_immutable();

ALTER TABLE shinka_private.application ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.application USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.owner ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.owner USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.request_receipt ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.request_receipt USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.test_operation ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.test_operation USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.user_profile USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.user_preferences USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.user_health_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.user_health_consent USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.user_health_consent_event ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.user_health_consent_event USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.user_cycle_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.user_cycle_settings USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.user_period_record ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.user_period_record USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.cycle_phase_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.cycle_phase_lookup USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.message_category_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.message_category_lookup USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.message_category_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.message_category_mapping USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.message_pair ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.message_pair USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.user_daily_message ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.user_daily_message USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.notification_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.notification_delivery USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.user_pattern_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.user_pattern_summary USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.moon_phase_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.moon_phase_lookup USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.admin_audit_log USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.system_error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.system_error_log USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.health_data_deletion_job ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.health_data_deletion_job USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

ALTER TABLE shinka_private.data_protection_event ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_server ON shinka_private.data_protection_event USING (app_id = current_setting('shinka.app_id', true)) WITH CHECK (app_id = current_setting('shinka.app_id', true));

REVOKE ALL ON ALL TABLES IN SCHEMA shinka_private FROM PUBLIC;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA shinka_private FROM PUBLIC;

DO $$ DECLARE browser_role text; BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=browser_role) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA shinka_private FROM %I',browser_role);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA shinka_private FROM %I',browser_role);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA shinka_private FROM %I',browser_role);
    END IF;
  END LOOP;
END $$;

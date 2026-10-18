// Authoritative 20 Shinka product-domain entities (DB v1.2 + Entity_Iliskiler v1.2). DOCUMENTED ONLY in this package.
// plannedName = future Base44 entity name convention (PascalCase). Constraint verification stays UNVERIFIED until measured.
const U = "UNVERIFIED";
const e = (name, group, owner, constraints, lifecycle, deletion) => ({
  name, plannedName: name.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(""),
  group, owner, constraints: constraints.map((c) => ({ rule: c, verification: U })), lifecycle, deletion, physicallyCreated: false,
});

export const DOMAIN_ENTITIES = Object.freeze([
  e("user_profile", "User", "user", ["UNIQUE(user_id)"], "EDITABLE", "Not deleted by Delete Account (INACTIVE)"),
  e("user_preferences", "User", "user", ["UNIQUE(user_id)"], "EDITABLE", "Retained"),
  e("user_health_consent", "Health", "user", ["UNIQUE(user_id)"], "EDITABLE_STATE", "Retained (minimal metadata)"),
  e("user_health_consent_event", "Health", "user", [], "APPEND_ONLY", "Never updated/deleted by admin"),
  e("user_cycle_settings", "Health", "user", ["UNIQUE(user_id)"], "EDITABLE", "Deleted on consent withdrawal"),
  e("user_period_record", "Health", "user", ["INDEX(user_id, period_start_date)", "≥15 days between starts (business rule)"], "EDITABLE", "Deleted on withdrawal / single delete"),
  e("user_cycle_prediction", "Health", "user", [], "DERIVED", "Deleted on withdrawal; recomputed atomically"),
  e("user_cycle_phase_day", "Health", "user", ["UNIQUE(user_id, phase_date)"], "DERIVED", "Deleted on withdrawal"),
  e("cycle_phase_lookup", "Lookup", "system", ["UNIQUE(cycle_length_days, period_duration_days, cycle_day)"], "REFERENCE", "Not user-deletable"),
  e("message_category_lookup", "Message", "system", ["UNIQUE(category_code)"], "REFERENCE", "Not deletable"),
  e("message_category_mapping", "Message", "system", ["UNIQUE(sun_sign_code, moon_phase_code, cycle_phase_code)"], "REFERENCE", "Not deletable"),
  e("message_pair", "Message", "system", ["INDEX(category_id, is_active)"], "EDITABLE_TEXT", "No deactivate/delete function"),
  e("user_daily_message", "Message", "user", ["UNIQUE(user_id, shinka_date)", "INDEX(user_id, generated_at)"], "IMMUTABLE_SNAPSHOT", "Never updated/deleted by admin"),
  e("notification_delivery", "Notification", "user", ["UNIQUE(daily_message_id, notification_type)"], "STATEFUL_JOB", "Retained"),
  e("user_pattern_summary", "Pattern", "user", ["UNIQUE(user_id)"], "DERIVED_SINGLE_ROW", "Overwritten in place"),
  e("moon_phase_lookup", "Moon", "system", ["INDEX(start_at_utc)", "[start, end) continuous, non-overlapping"], "REFERENCE_ROLLING", "Not user-deletable"),
  e("admin_audit_log", "Operations", "system", ["INDEX(admin_user_id, performed_at)"], "APPEND_ONLY", "Never updated/deleted"),
  e("system_error_log", "Operations", "system", [], "STATEFUL_DEDUPED", "Retained"),
  e("health_data_deletion_job", "Operations", "system", ["One open job per user (business rule)"], "BACKEND_ONLY_STATE", "Admin cannot complete/delete"),
  e("data_protection_event", "Operations", "system", [], "APPEND_ONLY", "Never updated/deleted by admin"),
]);

export const RELATIONSHIP_SOURCE = "Shinka_Veritabani_Entity_Iliskiler_v1.2.xlsx › 21_Iliskiler";
export const RELATIONSHIPS = Object.freeze([
  ["user_profile.user_id", "User.id"], ["user_preferences.user_id", "User.id"], ["user_health_consent.user_id", "User.id"],
  ["user_cycle_settings.user_id", "User.id"], ["user_pattern_summary.user_id", "User.id"], ["user_period_record.user_id", "User.id"],
  ["user_cycle_phase_day.user_id", "User.id"], ["user_cycle_phase_day.reference_period_id", "user_period_record.id"],
  ["user_cycle_prediction.reference_period_id", "user_period_record.id"], ["message_category_mapping.category_id", "message_category_lookup.id"],
  ["message_pair.category_id", "message_category_lookup.id"], ["user_daily_message.message_pair_id", "message_pair.id"],
  ["user_daily_message.category_id", "message_category_lookup.id"], ["notification_delivery.daily_message_id", "user_daily_message.id"],
  ["health_data_deletion_job.protection_event_id", "data_protection_event.id"], ["user_health_consent_event.user_id", "User.id"],
  ["user_cycle_prediction.user_id", "User.id"], ["user_daily_message.user_id", "User.id"], ["notification_delivery.user_id", "User.id"],
  ["admin_audit_log.admin_user_id", "User.id"], ["admin_audit_log.target_user_id", "User.id"],
  ["user_pattern_summary.primary_category_id", "message_category_lookup.id"], ["user_pattern_summary.secondary_category_id", "message_category_lookup.id"],
  ["data_protection_event.user_id", "User.id"],
].map(([from, to]) => ({ from, to, verification: U })));

// INTERNAL TOOLING storage — explicitly EXCLUDED from the 20-entity product contract.
export const INTERNAL_TOOLING_ENTITIES = Object.freeze([
  { name: "InternalHealthRun", purpose: "Health run history (redacted reports)", access: "admin-only RLS" },
]);
// Independently extracted field-name receipt from SRC-07 entity sheets; no product rows.
export const SOURCE_FIELD_NAMES = Object.freeze({
  "user_profile": [
    "user_id",
    "display_name",
    "birth_date",
    "birth_time",
    "birthplace_geonames_id",
    "birthplace_name",
    "birthplace_country_code",
    "birthplace_latitude",
    "birthplace_longitude",
    "sun_sign_code",
    "account_status"
  ],
  "user_preferences": [
    "user_id",
    "language_code",
    "notifications_enabled",
    "notification_time",
    "timezone"
  ],
  "user_health_consent": [
    "user_id",
    "consent_status",
    "consent_version",
    "granted_at",
    "withdrawn_at"
  ],
  "user_health_consent_event": [
    "user_id",
    "event_type",
    "consent_version",
    "occurred_at"
  ],
  "user_cycle_settings": [
    "user_id",
    "period_duration_days",
    "initial_cycle_length_days"
  ],
  "user_period_record": [
    "user_id",
    "period_start_date"
  ],
  "user_cycle_prediction": [
    "user_id",
    "reference_period_id",
    "predicted_start_date",
    "predicted_end_date",
    "estimated_cycle_length_days",
    "calculated_at"
  ],
  "user_cycle_phase_day": [
    "user_id",
    "phase_date",
    "phase_code",
    "calculation_basis",
    "reference_period_id",
    "calculated_at"
  ],
  "cycle_phase_lookup": [
    "cycle_length_days",
    "period_duration_days",
    "cycle_day",
    "phase_code"
  ],
  "message_category_lookup": [
    "category_code",
    "display_name_tr",
    "display_name_en"
  ],
  "message_category_mapping": [
    "sun_sign_code",
    "moon_phase_code",
    "cycle_phase_code",
    "category_id"
  ],
  "message_pair": [
    "category_id",
    "message_tr",
    "suggestion_tr",
    "message_en",
    "suggestion_en",
    "is_active"
  ],
  "user_daily_message": [
    "user_id",
    "shinka_date",
    "timezone",
    "category_id",
    "message_pair_id",
    "message_tr_snapshot",
    "suggestion_tr_snapshot",
    "message_en_snapshot",
    "suggestion_en_snapshot",
    "generated_at"
  ],
  "notification_delivery": [
    "user_id",
    "daily_message_id",
    "notification_type",
    "scheduled_at",
    "delivery_status",
    "attempt_count",
    "last_attempt_at",
    "sent_at",
    "error_code"
  ],
  "user_pattern_summary": [
    "user_id",
    "as_of_date",
    "timezone",
    "primary_category_id",
    "primary_count",
    "secondary_category_id",
    "secondary_count",
    "window_start_date",
    "window_end_date",
    "calculated_at"
  ],
  "moon_phase_lookup": [
    "phase_code",
    "start_at_utc",
    "end_at_utc"
  ],
  "admin_audit_log": [
    "admin_user_id",
    "target_user_id",
    "target_entity",
    "target_record_id",
    "action_type",
    "action_status",
    "performed_at",
    "error_code"
  ],
  "system_error_log": [
    "error_code",
    "process_name",
    "severity",
    "error_status",
    "retry_count",
    "last_retry_at",
    "resolved_at",
    "alert_sent_at",
    "correlation_id"
  ],
  "health_data_deletion_job": [
    "user_id",
    "protection_event_id",
    "job_status",
    "requested_at",
    "started_at",
    "completed_at",
    "retry_count",
    "last_retry_at",
    "error_code"
  ],
  "data_protection_event": [
    "user_id",
    "event_type",
    "event_status",
    "requested_at",
    "completed_at"
  ]
});
export const DATA_SOURCE_RECEIPT = Object.freeze({date:"2026-10-19", workbookSha256:"db4348c165d61c20527a3dc2903e623486f788f383bcce85196e7aed213bdd69", primaryDocSha256:"2e9a99d21309999641d246b0a66bad6c90570ce50afdfd03beb3ee154db94a29", scope:"SRC-05_AND_SRC-07_ONLY_NOT_ALL_SOURCE_ARTIFACTS"});

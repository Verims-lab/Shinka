// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-089",
    "package_name": "Calendar selected-day actions and verified recovery",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-27T06:58:18.395Z",
    "health_catalog_version": "HC-088.0",
    "short_summary": "Replace Calendar global editing with selected-day status and explicit add/move/delete. Distinguish recorded starts, derived/predicted intervals, today and selection. Preserve backend guards, confirmed readback, original-intent recovery, profile 087, navigation 083 and Home 088.",
    "full_health_status": "NOT_RUN",
    "notes": "188 cases retained, 5 updated; active 085–089. RC11/RC12 add permanent rejected-ABSENT/conflicting-receipt coverage; RC08 retains uncertainty after failed checks. Adapt existing CU/FX/mobile/Calendar matrices to direct date actions, consent, no future saves, same-ID move and confirmed deletion without duplicate writes. Backend/schema/service and all other product screens are protected. Exact results, failed attempts, unchanged byte budgets and hosted/device limits are in reports/SHINKA_CALENDAR_SIMPLIFICATION_089.md. No new health field, backend operation, storage, main write, PR, Base44 publication or production data action."
  },
  {
    "build_marker": "Buildmarker-090",
    "package_name": "Browsable Calendar recovery and top spacing",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-27T08:31:08.402Z",
    "health_catalog_version": "HC-089.0",
    "short_summary": "Separate Calendar inspection from original unresolved writes. Keep accurate day status, one recovery notice and explicit original continuation. Reduce Calendar logo/title gap without moving artwork, profile or navigation.",
    "full_health_status": "NOT_RUN",
    "notes": "188 cases retained, 5 updated; active 086–090. RC13–RC15/CU12 and mandatory 20-case App/spacing baseline cover November 11 pending, in-flight/late reads, immutable intent, receipt states, refresh/tab/reload, no replacement/duplicate writes and explicit continuation. Preserve 089 functionality, native/backend/schema/service and other product screens. Actual results, failed attempts, byte budgets and hosted/device blockers are in reports/SHINKA_CALENDAR_RECOVERY_090.md. No main write, PR, force-push, Base44 publication or production mutation."
  },
  {
    "build_marker": "Buildmarker-091",
    "package_name": "Calendar concise selected-day messages",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-27T15:40:25.657Z",
    "health_catalog_version": "HC-090.0",
    "short_summary": "Remove redundant Calendar no-record/no-prediction messages in TR/EN. Keep eligible date heading/save action, meaningful status and all existing data/recovery safeguards without layout or navigation changes.",
    "full_health_status": "NOT_RUN",
    "notes": "188 cases retained, 3 updated; active 087–091. CU13 adds permanent bilingual empty/selected-day and consent/saving protection; existing actual-App Calendar mobile checks assert concise content. Preserve records/predictions/future restrictions, validation and 090 recovery. Product backend/schema/service/controller, CSS/art/profile/navigation and other screens are unchanged; shared Health files change only package metadata/coverage. Actual local execution and unchanged budget failures remain separate from hosted/device NOT_RUN in reports/SHINKA_CALENDAR_MESSAGES_091.md. No live cancellation, production mutation, main write, PR or Base44 publication."
  },
  {
    "build_marker": "Buildmarker-092",
    "package_name": "Calendar optional empty-state invitation and consent",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-27T17:33:23.399Z",
    "health_catalog_version": "HC-091.0",
    "short_summary": "Use verified empty Calendar data for an optional first-period invitation and one approved consent checkbox. Preserve explicit local checkbox intent through unchanged reads/date selection; persist only through existing save, with no repeat for GRANTED consent.",
    "full_health_status": "NOT_RUN",
    "notes": "188 cases retained, 4 updated; active 088–092. CU14/CU15/RC16 plus existing mobile Calendar matrix cover empty/no-consent/GRANTED, full history, unchanged/revised/blocked/pending/private reads, withdrawal and event uniqueness. Keep original mutation, native/backend/security/recovery/onboarding contracts and 088/087/083 protected surfaces. Shared Health changes are package/coverage metadata only. Actual results, failed attempts, unchanged performance budgets and hosted/device limits are in reports/SHINKA_CALENDAR_CONSENT_092.md. No automatic grant, skip flag, new model/storage, real receipt operation, main write, PR or Base44 publication."
  },
  {
    "build_marker": "Buildmarker-093",
    "package_name": "Calendar idempotent receipt recovery and bounded readback throttling",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-27T20:29:09.838Z",
    "health_catalog_version": "HC-092.0",
    "short_summary": "Complete a verified existing period through original receipt-only recovery; retain security, revision, competing-operation and two-pass read guards. Calendar raw GET429 retries honor Retry-After within a bounded request budget; uncertain writes never retry automatically.",
    "full_health_status": "NOT_RUN",
    "notes": "188 cases retained, 3 updated; active 089–093. RC17–RC24 cover persisted November 3 record/readback429/PENDING/APPLIED without duplicates, receipt fencing and rival/revision/consent denial, bounded GET-only retry and sanitized diagnostics. Native TS entry tests retain lifecycle and Terms. No schema, UI, live mutation, main write, PR or Base44 publication. Published backend/source parity NOT_VERIFIED because CLI is not logged in. Actual local results, failed attempts, performance and owner rollout prerequisites are recorded separately in reports/SHINKA_CALENDAR_READBACK_093.md."
  }
];

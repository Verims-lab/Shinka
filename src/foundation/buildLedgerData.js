// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
  {
    "build_marker": "Buildmarker-075",
    "package_name": "Onboarding legal readiness and recovery",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-20T15:00:00Z",
    "health_catalog_version": "HC-074.0",
    "short_summary": "Keep missing legal configuration visible; separate readiness, explicit version-bound acceptance and fresh session admission. Read-only return/retry, bounded cancellation and transport diagnostics preserve onboarding and lifecycle authority.",
    "full_health_status": "NOT_RUN",
    "notes": "Owner approved terms-v1.0 on 2026-11-20 (product approval, not independent legal review). Live public policy CONFIGURATION_REQUIRED/version null; no management access, setting not applied. Chromium/WebKit 820/820 each; 44 legal and 32 auth-first scenarios each; mandatory quality/size gates PASS. HC changes H05-009/H06-008/H06-009/H13-012, 0 added/removed. Real OAuth/APK and owner configuration/publish remain open. See reports/SHINKA_ONBOARDING_RECOVERY_075.md."
  },
  {
    "build_marker": "Buildmarker-076",
    "package_name": "Unified onboarding provider entry",
    "package_type": "TARGETED_UI",
    "created_at": "2026-11-22T18:05:00Z",
    "health_catalog_version": "HC-075.0",
    "short_summary": "One Apple/Google entry uses native identity, current server Terms and verified onboarding progress. Privacy information reuses checkbox typography.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-075.0 updates H05-009, H06-002, H06-009, H13-012 and H13-021. Mandatory real-App checks cover both providers, new/incomplete/completed users, current/absent/outdated/unavailable acceptance and TR/EN typography. Execution is recorded in reports/SHINKA_UNIFIED_AUTHENTICATION_076.md."
  },
  {
    "build_marker": "Buildmarker-077",
    "package_name": "Accessible onboarding heading focus",
    "package_type": "TARGETED_UI",
    "created_at": "2026-11-22T20:08:47Z",
    "health_catalog_version": "HC-076.0",
    "short_summary": "All announced onboarding headings reuse the existing unframed focus treatment. Interactive keyboard indicators stay visible.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-076.0 updates H13-012 and H05-009. Mandatory presentation checks include logout to Welcome, automatic heading focus, keyboard rings and stable type/layout in both languages at mobile widths. U18 covers every numbered heading and preparation. Execution is in reports/SHINKA_ONBOARDING_FOCUS_077.md."
  },
  {
    "full_health_status": "NOT_RUN",
    "created_at": "2026-11-22T21:07:52Z",
    "notes": "HC-077.0 updates H13-012 and H05-009 without changing the 188-case inventory. Mandatory shared-navigation checks cover Home/Calendar/Pattern in TR/EN, four portrait widths and landscape, 200% text, injected safe areas, negative duplicate spacers and keyboard viewport restoration. See reports/SHINKA_NAVIGATION_ALIGNMENT_078.md for execution and physical-device limits.",
    "short_summary": "Separate the system gesture inset from the painted shared navigation row. Center each unchanged icon and label within the visible row, preserving total footer height and navigation behavior.",
    "package_name": "Centered visible bottom navigation",
    "health_catalog_version": "HC-077.0",
    "package_type": "TARGETED_UI",
    "build_marker": "Buildmarker-078"
  },
  {
    "short_summary": "Anchor the shared navigation to the visible application viewport, reserve its measured height in document flow, and keep 12px balanced internal padding separate from unoccluded system insets.",
    "health_catalog_version": "HC-078.0",
    "notes": "HC-078.0 updates H13-012 and H05-009 with the existing 188 cases. Mandatory navigation coverage measures actual viewport/safe-area position at initial/middle/end scroll, short/tall TR/EN mobile layouts, enlarged text, layout and synthetic visual viewport keyboard scenarios, negative footer offsets and retained tab/route motion. Original PNG, icons, type, colors and navigation data are preserved. Actual execution and remaining gate limits are in reports/SHINKA_FIXED_NAVIGATION_079.md.",
    "build_marker": "Buildmarker-079",
    "package_type": "TARGETED_UI",
    "package_name": "Viewport-anchored product navigation",
    "created_at": "2026-11-23T08:53:27Z",
    "full_health_status": "NOT_RUN"
  }
];

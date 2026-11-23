// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
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
  },
  {
    "package_name": "Android navigation viewport compensation",
    "created_at": "2026-11-23T10:29:36Z",
    "notes": "HC-079.0 updates H13-012 and H05-009, retaining 188 cases. A real CSS viewport oracle reproduces the 079 stale-innerHeight double compensation instead of repeating its offset formula. The mandatory navigation runner includes Android-like native and visual-only resize scenarios. Static published assets were inspected without application/data endpoints; physical Android and exact installed bundle remain NOT_RUN. See reports/SHINKA_ANDROID_VIEWPORT_080.md.",
    "build_marker": "Buildmarker-080",
    "health_catalog_version": "HC-079.0",
    "short_summary": "Measure the native CSS fixed anchor before applying any residual visual viewport correction. Separate content occlusion from positioning and retain balanced navigation spacing and system insets.",
    "full_health_status": "NOT_RUN",
    "package_type": "TARGETED_FIX"
  },
  {
    "build_marker": "Buildmarker-081",
    "package_name": "Visible navigation safe-area boundary and diagnostics",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-23T14:17:40.233Z",
    "health_catalog_version": "HC-080.0",
    "short_summary": "Remove transparent dock padding without resizing the bar. Position at the unconsumed safe boundary, reserve measured clearance once and expose an opt-in read-only geometry diagnostic. Native-consumed insets require a measured host declaration or correct native zeroing.",
    "full_health_status": "NOT_RUN",
    "notes": "HC-080.0 updates H13-012 and H05-009, retaining 188 cases. Mandatory regression measures the painted bar and dock independently with a 30px inset, explicit native-consumed, partial and edge-to-edge ownership, viewport restore and read-only diagnostic checks. The supplied Android video and published 080 assets are evidence of the report, not native viewport telemetry. No native inset bridge exists in this repository; default unverified insets stay protected. Physical resolution remains OPEN_PENDING_DEVICE_MEASUREMENTS_AND_NATIVE_OWNERSHIP. No publication or live data operation. See reports/SHINKA_NAVIGATION_SAFE_AREA_081.md."
  },
  {
    "build_marker": "Buildmarker-082",
    "package_name": "Mounted navigation measurements and 48px inset regression",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-23T19:30:29.216Z",
    "health_catalog_version": "HC-081.0",
    "short_summary": "Measure actual navigation through registered element references after mount, layout and viewport changes. Keep diagnostic actions accessible and cover both genuine and declared native-consumed 48px system regions. Preserve navigation dimensions and safe-area defaults.",
    "full_health_status": "NOT_RUN",
    "notes": "H13-012 and H05-009 update; catalog retains 188 cases. The 081 null snapshot is reproduced under held hydration before correction. Direct-reference, automatic refresh, retained-tab, resize, cleanup and 48px ownership regressions are mandatory. Physical screenshots report a 48px gap but omit usable-viewport and native bounds; do not infer consumed insets from zero declarations or screen size. The native ownership rule and navigation styles remain unchanged; physical position closure remains OPEN_PENDING_DEVICE_GEOMETRY_AND_NATIVE_OWNERSHIP. See reports/SHINKA_NAVIGATION_DIAGNOSTICS_082.md. No main write, publication or live data operation."
  }
];

// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
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
  },
  {
    "build_marker": "Buildmarker-083",
    "package_name": "Confirmed Android navigation position correction",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-23T20:21:15.096Z",
    "health_catalog_version": "HC-082.0",
    "short_summary": "Remove the extra positioning inset for the owner-confirmed Android clamped-viewport behavior. Match native CSS, visible/client viewport, available screen and painted/dock offset together; preserve genuine safe-area fallbacks and existing navigation dimensions.",
    "full_health_status": "NOT_RUN",
    "notes": "H13-012 and H05-009 update; retain 188 cases and active 079–083. The 082 receipt reproduces viewport 724, bar/dock 676, padding/occlusion 0 and bottom inset 48 before correction. Mandatory real-App regression requires bar/dock 724 with unchanged height and no native declaration; screen availHeight 772 comes from preceding owner diagnostics. The scoped compatibility rule is not universal native detection. Preserve explicit native contracts, iOS/genuine edge-to-edge/unknown/zoom/non-browser fallbacks, scrolling and keyboard reservation. Physical 083 after-verification remains pending owner publication; no main write or Base44 publication. See reports/SHINKA_ANDROID_POSITION_083.md."
  },
  {
    "full_health_status": "NOT_RUN",
    "package_type": "TARGETED_FIX",
    "notes": "H13-019 adds Apple and Google callback replays, legal and onboarding isolation, same-request continuation and lost native removal acknowledgement. H05-009 recognizes 084 under the existing content policy. No new schema or recovery policy. Hosted provider, platform erasure and affected account evidence require separate verification.",
    "health_catalog_version": "HC-083.0",
    "build_marker": "Buildmarker-084",
    "package_name": "Account deletion reauthentication recovery",
    "short_summary": "Keep deletion-restricted provider returns on Account & Privacy, verify the existing request with its native owner, and offer explicit continuation with read-only recovery after native removal.",
    "created_at": "2026-11-26T07:06:13.8695597Z"
  }
];

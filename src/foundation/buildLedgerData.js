// Generated active package data; update with scripts/recordBuild.mjs. Older entries remain in Git.
export default [
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
  },
  {
    "build_marker": "Buildmarker-085",
    "package_name": "Admin-only isolated onboarding simulation",
    "package_type": "FEATURE",
    "created_at": "2026-11-26T08:46:41.952Z",
    "health_catalog_version": "HC-084.0",
    "short_summary": "Add an admin-only visual rehearsal of the real onboarding 1–5/preparation components with in-memory providers, policy, profile, cycle and first-daily responses. Preserve real authentication, legal admission and account progress.",
    "full_health_status": "NOT_RUN",
    "notes": "H12-028, H13-016 and H05-009 update; retain 188 cases and active 081–085. SIM01/SIM02 and the mandatory real-App Chromium/WebKit matrix cover declarations, both fake providers, forms, Back, preparation, exit/restart, route denial and no product/OAuth/storage mutation. See reports/SHINKA_ONBOARDING_TEST_MODE_085.md for actual execution and retained failures. Simulation is not real integration acceptance. Earlier byte-gate failures and physical/provider prerequisites remain separate. No main write, production data operation or Base44 publication."
  },
  {
    "build_marker": "Buildmarker-086",
    "package_name": "Home spacing, typography and soft reading surfaces",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-26T09:41:14.416Z",
    "health_catalog_version": "HC-085.0",
    "short_summary": "Refine Home only: one aligned greeting/profile row, smaller existing type tokens and two separate translucent rounded reading surfaces. Preserve original background, complete bottom navigation, 083 correction and all data/selection behavior.",
    "full_health_status": "NOT_RUN",
    "notes": "H05-009, H07-013 and H13-012 update; retain 188 cases and 082–086. Both-engine real-App matrix covers 48 responsive/localized/theme/text combinations plus unchanged art/navigation baseline and protected source hashes. Preserve daily/Retry/access and 083 navigation regressions. The 055 Home transparency rule is superseded only for these outer surfaces; preparation and shared card defaults stay plain/unchanged. See reports/SHINKA_HOME_REFINEMENT_086.md for actual results, retained failures and unchanged byte budgets. No main write, PR, Base44 publication or production operation."
  },
  {
    "build_marker": "Buildmarker-087",
    "package_name": "Shared profile control in the safe logo corner",
    "package_type": "TARGETED_FIX",
    "created_at": "2026-11-26T15:09:33.890Z",
    "health_catalog_version": "HC-086.0",
    "short_summary": "Move existing Home/Calendar/Pattern/You profile controls to one safe logo-corner position. Preserve control design/access, hidden-tab ownership, Home 086 content layout, background and 083 navigation behavior.",
    "full_health_status": "NOT_RUN",
    "notes": "H05-009, H07-013 and H13-012 update; retain 188 cases and 083–087. Mandatory both-engine 112-case real-App profile matrix checks safe areas, no duplicates, keyboard/profile navigation, original icon style and unchanged baseline headings/Home cards/art/nav. Existing Home and 083 gates remain. No provider, portal, auth/data/routing or dependency change. Actual execution, retained failures and unchanged byte budgets are in reports/SHINKA_PROFILE_POSITION_087.md. Physical/device/hosted acceptance remains external; no main write, PR or Base44 publication."
  }
];

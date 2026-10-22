// User-approved 018/019 scope separation. IDs and acceptance coverage are retained.
export const HEALTH_SCOPE_TRANSFERS = Object.freeze([
  {id:'H12-041',localOnly:true,tests:'SC01–SC05, SC07–SC09, scripts/verifySecurity028.mjs',coverage:'028 server fixtures: bounded JSON; GeoNames guard/adapter app, user-upstream and worker limits; onboarding 429/Retry-After and You error-envelope injection (not saveProfile); network/forged-error 503; unauthenticated and oversize handler rejection without writes'},
  {id:'H13-019',localOnly:true,tests:'PV01–PV04, scripts/checkPrivacyFlow.mjs',coverage:'Confirmed privacy actions, same-request recovery, incomplete onboarding and mobile modal focus'},
  {id:'H13-018',localOnly:true,tests:'YU01–YU06, scripts/checkYouFlow.mjs',coverage:'You profile/preferences, unknown result, logout, current admin, saved locale and 320px/200% forms'},
  {id:'H13-017',localOnly:true,tests:'PU01–PU05, scripts/checkPatternFlow.mjs',coverage:'Pattern TR/EN, isolated section retry, stale response, mobile timeline labels and product routes'},
  {id:'H15-002',localOnly:true,tests:'scripts/measureMaintenance.mjs',coverage:'Production emitted bundle budgets and loopback route lab; field p75 is not inferred'},
  {id:'H03-007', localOnly:true, tests:'All canonical Foundation regressions', coverage:'Chromium/WebKit, auth, contracts, security and UI'},
  {id:'H07-013', localOnly:true, tests:'DU01–DU05', coverage:'ON-06/Home components, locale and late navigation'},
  {id:'H12-025', localOnly:true, tests:'AN02–AN07', coverage:'AuthContext, route/admin boundaries, stale sessions'},
  {id:'H13-012', localOnly:true, tests:'U12–U14, T76/T79, MI04–MI05, scripts/checkMobile.mjs, scripts/checkMobileExperience.mjs', coverage:'320/360/390/430px and landscape/reduced viewport; TR/EN light/dark and 200% text, contrast, shared sheet/focus/history, refresh/unknown intent and reduced motion; not physical devices'},
  {id:'H13-015', localOnly:true, tests:'Calendar UI regressions', coverage:'TR/EN, keyboard, consent and explicit actions'},
  {id:'H13-016', localOnly:true, tests:'AU01–AU05 and subsequent recovery UI cases', coverage:'TR/EN deletion/reset, focus, cancellation, double click and recovery'},
  {id:'H10-003', localOnly:false, tests:'U09–U12', coverage:'GeoNames selection UI; pure provider/cache/validation checks stay in-app'},
  {id:'H13-004', localOnly:false, tests:'T24/T41/T74/HC01 and CLI mobile checks', coverage:'360px Health/Build and auth viewport; in-app case measures only the current viewport'},
]);
export const LOCAL_HEALTH_IDS = new Set(HEALTH_SCOPE_TRANSFERS.filter(item=>item.localOnly).map(item=>item.id));

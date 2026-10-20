// User-approved 018 scope transfer. IDs and acceptance coverage are retained.
export const HEALTH_SCOPE_TRANSFERS = Object.freeze([
  {id:'H03-007', localOnly:true, tests:'All canonical Foundation regressions', coverage:'Chromium/WebKit, auth, contracts, security and UI'},
  {id:'H07-013', localOnly:true, tests:'DU01–DU05', coverage:'ON-06/Home components, locale and late navigation'},
  {id:'H12-025', localOnly:true, tests:'AN02–AN07', coverage:'AuthContext, route/admin boundaries, stale sessions'},
  {id:'H13-012', localOnly:true, tests:'U12–U14', coverage:'320/360px, landscape, enlarged text, native inputs and long TR lists'},
  {id:'H13-015', localOnly:true, tests:'Calendar UI regressions', coverage:'TR/EN, keyboard, consent and explicit actions'},
  {id:'H13-016', localOnly:true, tests:'AU01–AU05 and subsequent recovery UI cases', coverage:'TR/EN deletion/reset, focus, cancellation, double click and recovery'},
  {id:'H10-003', localOnly:false, tests:'U09–U12', coverage:'GeoNames selection UI; pure provider/cache/validation checks stay in-app'},
  {id:'H13-004', localOnly:false, tests:'T24/T41/T74/HC01 and CLI mobile checks', coverage:'360px Health/Build and auth viewport; in-app case measures only the current viewport'},
]);
export const LOCAL_HEALTH_IDS = new Set(HEALTH_SCOPE_TRANSFERS.filter(item=>item.localOnly).map(item=>item.id));

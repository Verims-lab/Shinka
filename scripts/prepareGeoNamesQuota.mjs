// Offline payload ONLY: no SDK, network, credentials, create/update or deployment.
// A saturated bootstrap conservatively accounts for unknown prior legacy use.
// Operator must first drain old handlers and ensure no APP_CREDITS_V1 row exists.
import { GEONAMES_DAILY_CAP, GEONAMES_QUOTA_SCOPE } from '../base44/shared/geonamesDailyQuota.js';
const hour = Math.floor(Date.now()/3600000);
console.log(JSON.stringify({scope:GEONAMES_QUOTA_SCOPE,revision:0,window_hour:hour,buckets:[{hour,credits:GEONAMES_DAILY_CAP}]},null,2));

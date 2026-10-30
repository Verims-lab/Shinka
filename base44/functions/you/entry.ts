import { createNativeClient } from '../../shared/nativeClient.ts';
import { secrets } from 'base44:runtime';
import { handleYouRequest } from '../../shared/youOperation.js';
import { createGeoNamesAdapter } from '../../shared/geonamesAdapter.js';
import { createGeoNamesGuard } from '../../shared/geonamesGuard.js';
import { createDailyQuota } from '../../shared/geonamesDailyQuota.js';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
const guard = createGeoNamesGuard();
/** @param {Request} req */
export default function you(req) {
  const dailyQuota = createDailyQuota(createClientFromRequest(req).asServiceRole.entities.GeoNamesDailyQuota);
  const geoNamesFor = owner => guard.forOwner(owner, fetcher => createGeoNamesAdapter({ username: secrets.get('GEONAMES_USERNAME'), fetcher }), { dailyQuota });
  return handleYouRequest(req, createNativeClient, { geoNamesFor });
}
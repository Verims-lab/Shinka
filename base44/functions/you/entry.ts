import { createNativeClient } from '../../shared/nativeClient.ts';
import { secrets } from 'base44:runtime';
import { handleYouRequest } from '../../shared/youOperation.js';
import { createGeoNamesAdapter } from '../../shared/geonamesAdapter.js';
import { createGeoNamesGuard } from '../../shared/geonamesGuard.js';
const guard = createGeoNamesGuard();
/** @param {Request} req */
export default function you(req) {
  const geoNamesFor = owner => guard.forOwner(owner, fetcher => createGeoNamesAdapter({ username: secrets.get('GEONAMES_USERNAME'), fetcher }));
  return handleYouRequest(req, createNativeClient, { geoNamesFor });
}
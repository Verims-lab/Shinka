import { createNativeClient } from '../../shared/nativeClient.ts';
import { secrets } from 'base44:runtime';
import { handleYouRequest } from '../../shared/youOperation.js';
import { createGeoNamesAdapter } from '../../shared/geonamesAdapter.js';
/** @param {Request} req */
export default function you(req) {
  return handleYouRequest(req, createNativeClient, { geoNames: createGeoNamesAdapter({ username: secrets.get('GEONAMES_USERNAME') }) });
}

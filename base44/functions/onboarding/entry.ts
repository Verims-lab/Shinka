import {secrets} from 'base44:runtime';
import {handleSqlRequest} from '../../shared/postgres/http.js';
import {openHostedSql} from '../../shared/postgres/hosted.ts';
import {createGeoNamesAdapter} from '../../shared/geonamesAdapter.js';
export default function onboarding(req) {
  const geoNames=createGeoNamesAdapter({username:secrets.get('GEONAMES_USERNAME')});
  return handleSqlRequest(req,'onboarding',openHostedSql,{geoNames});
}

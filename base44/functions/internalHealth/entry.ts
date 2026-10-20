import {secrets} from 'base44:runtime';
import {handleSqlRequest} from '../../shared/postgres/http.js';
import {openHostedSql} from '../../shared/postgres/hosted.ts';
import {createGeoNamesRuntimeProbe} from '../../shared/geonamesRuntimeProbe.js';
const runGeoNamesProbe=createGeoNamesRuntimeProbe();
export default req => handleSqlRequest(req,'internalHealth',openHostedSql,{
  // SQL admin authorization precedes this secret read and outbound fetch.
  geoNamesTransportProbe:()=>runGeoNamesProbe({username:secrets.get('GEONAMES_USERNAME'),signal:req.signal}),
});

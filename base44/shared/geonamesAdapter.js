import { OnboardingError, normalizeGeoNamesPlace } from './onboardingValidation.js';
export function sanitizePlaceQuery(input) {
  if(typeof input!=='string')throw new OnboardingError('GEONAMES_QUERY_INVALID','birthplace',400);
  const query=input.normalize('NFKC').trim().replace(/\s+/g,' ');
  if(query.length<2||query.length>80||!/^[\p{L}\p{M}\p{N}\s'’.,()-]+$/u.test(query))throw new OnboardingError('GEONAMES_QUERY_INVALID','birthplace',400);
  return query;
}
export function createGeoNamesAdapter({username,fetcher=fetch,timeoutMs=8000}) {
  const request=async(path,params)=>{
    if(!username)throw new OnboardingError('GEONAMES_CONFIGURATION_REQUIRED',null,503);
    // GeoNames serves valid HTTPS certificates on its secure host.
    const url=new URL(`https://secure.geonames.org/${path}`);
    Object.entries({...params,username}).forEach(([key,value])=>url.searchParams.set(key,String(value)));
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),timeoutMs);
    try {
      const response=await fetcher(url,{signal:abort.signal,redirect:'error'});
      if(!response.ok)throw new Error('provider unavailable');
      const text=await response.text();if(text.length>100000)throw new Error('provider response too large');
      const data=JSON.parse(text);if(data.status)throw new Error('provider failure');return data;
    }catch{throw new OnboardingError('GEONAMES_UNAVAILABLE',null,503);}finally{clearTimeout(timer);}
  };
  return {
    search:async(query,language)=>{const data=await request('searchJSON',{q:sanitizePlaceQuery(query),maxRows:8,lang:language==='tr'?'tr':'en',style:'FULL',featureClass:'P'});if(!Array.isArray(data.geonames))throw new OnboardingError('GEONAMES_INVALID_RESULT',null,502);return data.geonames.slice(0,8).map(normalizeGeoNamesPlace);},
    resolve:async(id)=>{if(!Number.isSafeInteger(id)||id<=0)throw new OnboardingError('BIRTHPLACE_SELECTION_REQUIRED','birthplace');const place=normalizeGeoNamesPlace(await request('getJSON',{geonameId:id,style:'FULL'}));if(place.birthplace_geonames_id!==id)throw new OnboardingError('GEONAMES_INVALID_RESULT',null,502);return place;},
  };
}

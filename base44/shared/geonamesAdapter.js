import { OnboardingError, normalizeGeoNamesPlace } from './onboardingValidation.js';
import { GeoNamesError } from './geonamesDiagnostics.js';
export function sanitizePlaceQuery(input) {
  if(typeof input!=='string')throw new OnboardingError('GEONAMES_QUERY_INVALID','birthplace',400);
  const query=input.normalize('NFKC').trim().replace(/\s+/g,' ');
  if(query.length<2||query.length>80||!/^[\p{L}\p{M}\p{N}\s'’.,()-]+$/u.test(query))throw new OnboardingError('GEONAMES_QUERY_INVALID','birthplace',400);
  return query;
}
export function createGeoNamesAdapter({username,fetcher=fetch,timeoutMs=8000}) {
  const configuredUsername=typeof username==='string'?username.trim():'';
  const request=async(path,params)=>{
    if(!configuredUsername)throw new GeoNamesError('GEONAMES_SECRET_MISSING');
    // Server-owned HTTPS destination. Client input can never override its host/path.
    const url=new URL(`https://secure.geonames.org/${path}`);
    Object.entries({...params,username:configuredUsername}).forEach(([key,value])=>url.searchParams.set(key,String(value)));
    const abort=new AbortController();let timer,httpStatus=null;
    try {
      return await Promise.race([
        (async()=>{
          const response=await fetcher(url,{signal:abort.signal,redirect:'error'});
          httpStatus=response.status;
          const text=await response.text();
          if(new TextEncoder().encode(text).byteLength>100000)throw new GeoNamesError('GEONAMES_INVALID_RESPONSE',response.status);
          let data;
          try{data=JSON.parse(text);}catch{throw new GeoNamesError(response.ok?'GEONAMES_INVALID_RESPONSE':'GEONAMES_HTTP_ERROR',response.status);}
          if(!data||typeof data!=='object'||Array.isArray(data))throw new GeoNamesError(response.ok?'GEONAMES_INVALID_RESPONSE':'GEONAMES_HTTP_ERROR',response.status);
          if(Object.hasOwn(data,'status')){
            if(!data.status||!Number.isInteger(data.status.value))throw new GeoNamesError('GEONAMES_INVALID_RESPONSE',response.status);
            // GeoNames documents status 15 as "no result found". It is empty only
            // for a successful search, never a valid selected-ID lookup.
            if(response.ok&&path==='searchJSON'&&data.status.value===15)return {data:{geonames:[]},httpStatus:response.status};
            throw new GeoNamesError('GEONAMES_PROVIDER_REJECTED',response.status,data.status.value);
          }
          if(!response.ok)throw new GeoNamesError('GEONAMES_HTTP_ERROR',response.status);
          return {data,httpStatus:response.status};
        })(),
        new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(new GeoNamesError('GEONAMES_REQUEST_TIMEOUT',httpStatus));},timeoutMs);}),
      ]);
    }catch(error){
      if(error instanceof GeoNamesError)throw error;
      throw new GeoNamesError(abort.signal.aborted?'GEONAMES_REQUEST_TIMEOUT':'GEONAMES_NETWORK_ERROR',httpStatus);
    }finally{clearTimeout(timer);}
  };
  const normalize=(raw,httpStatus)=>{
    try{return normalizeGeoNamesPlace(raw);}catch{throw new GeoNamesError('GEONAMES_INVALID_RESPONSE',httpStatus);}
  };
  return {
    search:async(query,language)=>{
      const {data,httpStatus}=await request('searchJSON',{q:sanitizePlaceQuery(query),maxRows:8,lang:language==='tr'?'tr':'en',style:'FULL',featureClass:'P'});
      if(!Array.isArray(data.geonames))throw new GeoNamesError('GEONAMES_INVALID_RESPONSE',httpStatus);
      return data.geonames.slice(0,8).map(raw=>normalize(raw,httpStatus));
    },
    resolve:async(id)=>{
      if(!Number.isSafeInteger(id)||id<=0)throw new OnboardingError('BIRTHPLACE_SELECTION_REQUIRED','birthplace');
      const {data,httpStatus}=await request('getJSON',{geonameId:id,style:'FULL'});
      const place=normalize(data,httpStatus);
      if(place.birthplace_geonames_id!==id)throw new GeoNamesError('GEONAMES_INVALID_RESPONSE',httpStatus);
      return place;
    },
  };
}

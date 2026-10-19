import { OnboardingError, normalizeGeoNamesPlace } from './onboardingValidation.js';
import { GeoNamesError } from './geonamesDiagnostics.js';

const PAGE_SIZE=100,MAX_OFFSET=5000;
const invalid=()=>{throw new GeoNamesError('GEONAMES_INVALID_RESPONSE',200,null,'RESPONSE_VALIDATION');};
const incomplete=()=>{throw new OnboardingError('PLACE_HIERARCHY_INCOMPLETE','birthplace',422);};
const validId=id=>Number.isSafeInteger(id)&&id>0;
const name=value=>typeof value==='string'&&value.trim()&&value.length<=200?value.trim():invalid();
const code=value=>typeof value==='string'&&/^[\p{L}\p{N}.-]{1,40}$/u.test(value)?value:null;
const adminLevel=raw=>raw?.fcl==='A'&&/^ADM[1-5]$/.test(raw.fcode)?Number(raw.fcode.slice(3)):0;
const readArray=data=>Array.isArray(data.geonames)?data.geonames:invalid();
const unique=items=>{if(new Set(items.map(x=>x.id)).size!==items.length)invalid();return items;};
const validateLanguage=language=>{if(!['en','tr'].includes(language))throw new OnboardingError('LANGUAGE_INVALID',null,400);};
const validateScope=({country,parent_id=null,offset=0,language_code})=>{
  validateLanguage(language_code);
  if(typeof country!=='string'||!/^[A-Z]{2}$/.test(country)||(parent_id!==null&&!validId(parent_id))||!Number.isSafeInteger(offset)||offset<0||offset>MAX_OFFSET||offset%PAGE_SIZE!==0)throw new OnboardingError('INVALID_REQUEST',null,400);
};

// Official countryInfo + hierarchy + filtered search. No childrenJSON pagination,
// whole-country prefetch, client provider parameters or cross-request cache.
export function createGeoNamesHierarchy(request) {
  const session=()=>{
    const deadline=performance.now()+20000;
    return (path,params,maxBytes=100000)=>{
      const remaining=deadline-performance.now();
      if(remaining<=0)throw new GeoNamesError('GEONAMES_REQUEST_TIMEOUT',null,null,'FETCH','TIMEOUT');
      return request(path,params,{maxBytes,deadlineMs:Math.min(8000,remaining)});
    };
  };
  const countries=async(language,call,country=undefined)=>{
    validateLanguage(language);
    const {data}=await call('countryInfoJSON',{lang:language,...(country?{country}:{})},524288);
    const records=readArray(data);
    if(!records.length||records.length>300)invalid();
    const items=unique(records.map(raw=>{
      const id=Number(raw.geonameId);
      if(!validId(id)||typeof raw.countryCode!=='string'||!/^[A-Z]{2}$/.test(raw.countryCode))invalid();
      return {id,country:raw.countryCode,name:name(raw.countryName)};
    }));
    if(new Set(items.map(x=>x.country)).size!==items.length)invalid();
    if(country&&(items.length!==1||items[0].country!==country))invalid();
    return items.sort((a,b)=>a.name.localeCompare(b.name,language));
  };
  const scope=async(input,call)=>{
    validateScope(input);
    if(input.parent_id==null){await countries(input.language_code,call,input.country);return {level:0,codes:{}};}
    const {data:parent}=await call('getJSON',{geonameId:input.parent_id,style:'FULL'});
    const level=adminLevel(parent);
    if(Number(parent.geonameId)!==input.parent_id||parent.countryCode!==input.country||!level)invalid();
    const codes={};
    for(let i=1;i<=level;i++){const value=code(parent[`adminCode${i}`]);if(value)codes[`adminCode${i}`]=value;}
    if(!codes[`adminCode${level}`])incomplete();
    const {data}=await call('hierarchyJSON',{geonameId:input.parent_id});
    const ancestors=readArray(data);
    if(ancestors.length>16)invalid();
    if(!ancestors.some(a=>a.fcl==='A'&&/^PCL/.test(a.fcode)&&a.countryCode===input.country))incomplete();
    for(const ancestor of ancestors){
      if(ancestor.countryCode&&ancestor.countryCode!==input.country)invalid();
      const ancestorLevel=adminLevel(ancestor);
      if(ancestorLevel>level)invalid();
      if(ancestorLevel&&Number(ancestor.geonameId)!==input.parent_id){
        const key=`adminCode${ancestorLevel}`,value=code(ancestor[key]);
        if(!value&&!codes[key])incomplete();
        if(value&&codes[key]&&codes[key]!==value)invalid();
        if(value&&!codes[key])codes[key]=value;
      }
    }
    return {level,codes};
  };
  const page=async(input,parent,kind,level,offset,call)=>{
    const params={q:input.country,country:input.country,...parent.codes,lang:input.language_code,style:'FULL',featureClass:kind==='REGION'?'A':'P',...(kind==='REGION'?{featureCode:`ADM${level}`} : {}),maxRows:PAGE_SIZE,startRow:offset};
    const {data}=await call('searchJSON',params,1048576);
    const rows=readArray(data),total=data.totalResultsCount;
    if(!Number.isSafeInteger(total)||total<0||total>10000000||rows.length!==Math.min(PAGE_SIZE,Math.max(0,total-offset)))invalid();
    if(offset>0&&offset>=total)throw new OnboardingError('INVALID_REQUEST',null,400);
    const options=unique(rows.map(raw=>{
      if(raw.countryCode!==input.country||Object.entries(parent.codes).some(([k,v])=>raw[k]!==v))invalid();
      const id=Number(raw.geonameId);
      if(!validId(id)||id===input.parent_id)invalid();
      if(kind==='REGION'&&adminLevel(raw)!==level)invalid();
      if(kind==='PLACE'&&raw.fcl!=='P')invalid();
      const context=[...new Set([1,2,3,4,5].map(i=>raw[`adminName${i}`]).filter(v=>typeof v==='string'&&v.trim()).map(name)),input.country].join(' · ');
      let place=null;
      if(kind==='PLACE'){try{place=normalizeGeoNamesPlace(raw);}catch{invalid();}}
      return {id,name:name(raw.name),context,kind,level:kind==='REGION'?level:null,...(place?{place}:{})};
    }));
    // Sort within a provider page only; never imply a globally alphabetical result.
    options.sort((a,b)=>a.name.localeCompare(b.name,input.language_code)||a.id-b.id);
    return {options,total,offset,next_offset:offset+rows.length<total&&offset+PAGE_SIZE<=MAX_OFFSET?offset+PAGE_SIZE:null,previous_offset:offset?offset-PAGE_SIZE:null,limited:total>MAX_OFFSET+PAGE_SIZE,level:kind==='REGION'?level:null};
  };
  return {
    countries:async language=>({options:await countries(language,session())}),
    regions:async input=>{
      const call=session(),parent=await scope(input,call);
      for(let level=parent.level+1;level<=5;level++){
        const first=await page(input,parent,'REGION',level,0,call);
        if(first.total)return input.offset? page(input,parent,'REGION',level,input.offset,call):first;
      }
      if(input.offset)throw new OnboardingError('INVALID_REQUEST',null,400);
      return {options:[],total:0,offset:0,next_offset:null,previous_offset:null,limited:false,level:null,hierarchy_status:'NO_SUBDIVISIONS'};
    },
    places:async input=>{const call=session(),parent=await scope(input,call);return page(input,parent,'PLACE',null,input.offset??0,call);},
  };
}

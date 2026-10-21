import BirthplacePicker from '@/features/profile/BirthplacePicker';
const resource = (options, offset=0, total=options.length) => ({ options, offset, total, next_offset:offset+options.length<total?offset+options.length:null, previous_offset:offset?Math.max(0,offset-50):null });
const request = async (action, payload) => {
  window.__sheetCalls ||= []; window.__sheetCalls.push({action,offset:payload.offset||0});
  if(action==='listPlaceCountries')return resource([{id:100,kind:'COUNTRY',name:'Fixture country',country:'TR'}]);
  if(action==='listPlaceRegions')return {...resource([]),hierarchy_status:'NO_SUBDIVISIONS'};
  const offset=payload.offset||0;
  return resource(Array.from({length:50},(_,i)=>({id:1000+offset+i,kind:'PLACE',name:'Uzun yerleşim adı · Aynı adlı yerleşim / Long settlement label',context:`Bölge / Region ${i%5}`,place:{birthplace_geonames_id:1000+offset+i,birthplace_name:'Synthetic settlement',birthplace_country_code:'TR',birthplace_latitude:1,birthplace_longitude:1}})),offset,150);
};
export default function MobileSheetFixture(){return <main className="shinka-safe-content bg-shinka-ivory text-shinka-ink"><BirthplacePicker language="tr" request={request} onChange={()=>{}}/></main>;}

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import ShinkaSelect from '@/components/shinka/ShinkaSelect';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
import { createBirthplacePicker } from './birthplaceSelection';

/** @param {{language:string,request:Function,selection?:any,onChange:Function,disabled?:boolean,error?:boolean}} props */
export default function BirthplacePicker({language,request,selection=null,onChange,disabled=false,error=false}) {
  const callback=useRef(onChange);callback.current=onChange;
  const picker=useMemo(()=>createBirthplacePicker({request,selection,onChange:value=>callback.current(value)}),[request]);
  const state=useSyncExternalStore(picker.subscribe,picker.getSnapshot);
  const t=key=>onboardingCopy(key,language);
  useEffect(()=>{void picker.start(language);return picker.dispose;},[picker]);
  useEffect(()=>{void picker.language(language);},[picker,language]);
  const optionText=option=>`${option.name}${option.context?` · ${option.context}`:''}`;
  const list=(key,label,placeholder,data,selected,choose,unavailable=false)=>{
    const options=selected&&!data.options.some(x=>x.id===selected.id)?[selected,...data.options]:data.options;
    const selectedOption=options.find(option=>option.id===selected?.id);
    const ids=`place-${key}`,duplicates=new Set(options.filter((x,i)=>options.some((y,j)=>i!==j&&optionText(x)===optionText(y))).map(optionText));
    return <div className="min-w-0 space-y-2" key={key}>
      <label htmlFor={ids} className="block text-shinka-body">{label}</label>
      <ShinkaSelect id={ids} value={selected?.id??''} disabled={disabled||unavailable||data.status!=='READY'||!data.options.length} onChange={e=>choose(Number(e.target.value))} aria-busy={data.status==='LOADING'} aria-describedby={`${ids}-status`}>
        <option value="" disabled>{placeholder}</option>
        {options.map(option=><option key={option.id} value={option.id}>{optionText(option)}{duplicates.has(optionText(option))?` · #${option.id}`:''}</option>)}
      </ShinkaSelect>
      {selectedOption?.context&&<p className="break-words text-shinka-small text-shinka-taupe">{optionText(selectedOption)}</p>}
      <div id={`${ids}-status`} className="space-y-2 text-shinka-small text-shinka-taupe" role="status" aria-live="polite">
        {data.status==='LOADING'&&<p>{t('placeLoading')}</p>}
        {data.status==='ERROR'&&<><p>{t(data.error)}</p><ShinkaButton variant="secondary" disabled={disabled} onClick={()=>picker.retry(key)}>{t('retry')}</ShinkaButton></>}
        {data.status==='READY'&&!data.options.length&&<p>{t(data.hierarchy_status==='NO_SUBDIVISIONS'?'placeNoRegions':'placeEmpty')}</p>}
        {data.status==='READY'&&data.total>0&&<p>{t('placePage').replace('{from}',String(data.offset+1)).replace('{to}',String(data.offset+data.options.length)).replace('{total}',String(data.total))}</p>}
        {data.limited&&<p>{t('placeLimit')}</p>}
      </div>
      {(data.previous_offset!==null||data.next_offset!==null)&&<div className="flex flex-wrap gap-2" aria-label={t('placePages')}>
        <ShinkaButton variant="secondary" disabled={disabled||data.status==='LOADING'||data.previous_offset===null} onClick={()=>picker.page(key,data.previous_offset)}>{t('placePrevious')}</ShinkaButton>
        <ShinkaButton variant="secondary" disabled={disabled||data.status==='LOADING'||data.next_offset===null} onClick={()=>picker.page(key,data.next_offset)}>{t('placeNext')}</ShinkaButton>
      </div>}
    </div>;
  };
  return <fieldset id="birthplace" tabIndex={-1} aria-invalid={error} aria-describedby={error?'birthplace-error':'birthplace-help'} className="min-w-0 space-y-4 rounded-shinka-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-shinka-plum" data-birthplace-picker>
    <legend className="mb-2 text-shinka-body font-medium">{t('birthplace')} <span className="font-normal text-shinka-taupe">{t('placeOptional')}</span></legend>
    <p id="birthplace-help" className="text-shinka-small text-shinka-taupe">{t('placeHelp')}</p>
    {state.selection&&<div className="space-y-1 rounded-shinka-sm bg-shinka-lavender p-4" role="status" data-place-summary><p className="text-shinka-small text-shinka-plum">{t('placeSelected')}</p><p className="break-words font-medium">{state.selection.birthplace_name} · {state.selection.birthplace_country_code}</p></div>}
    {!state.editing?<ShinkaButton variant="secondary" disabled={disabled} onClick={picker.edit}>{t('placeChange')}</ShinkaButton>:<>
      {list('countries',t('placeCountry'),t('placeChooseCountry'),state.countries,state.country,picker.country)}
      {!state.country&&list('region',t('placeRegion'),t('placeChooseCountryFirst'),{status:'IDLE',options:[],previous_offset:null,next_offset:null},null,()=>{},true)}
      {state.country&&state.regions.map((data,index)=>{
        const level=data.level??state.path[index]?.level??(state.path[index-1]?.level||0)+1;
        return list(String(index),t(level===1?'placeRegion':level===2?'placeDistrict':'placeSubregion'),t('placeChooseRegion'),data,state.path[index],id=>picker.region(index,id));
      })}
      {list('places',t('placeSettlement'),t(state.country?'placeChooseSettlement':'placeChooseCountryFirst'),state.places,state.selection?{id:state.selection.birthplace_geonames_id,name:state.selection.birthplace_name,context:state.selection.birthplace_country_code}:null,picker.place,!state.country)}
      {state.incomplete&&<p className="text-shinka-small text-shinka-taupe">{t('PLACE_SELECTION_INCOMPLETE')}</p>}
    </>}
    <ShinkaButton variant="ghost" disabled={disabled} onClick={picker.clear} data-place-clear>{t('placeClear')}</ShinkaButton>
  </fieldset>;
}

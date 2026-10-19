import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import PageContainer from '@/components/shinka/PageContainer';
import ShinkaCard from '@/components/shinka/ShinkaCard';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import ShinkaInput from '@/components/shinka/ShinkaInput';
import SignIn from './SignIn';
import BirthplacePicker from './BirthplacePicker';
import { beginProviderAuth } from '@/services/authService';
import { readPendingName, savePendingName, clearPendingName } from './pendingName';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
import { optionalName, optionalBirthTime, validateBirthDate, validateCycleInput, OnboardingError } from '../../../base44/shared/onboardingValidation.js';
import { onboardingRequest } from '@/services/onboardingService';
const DEFAULT_PENDING={read:readPendingName,save:savePendingName,clear:clearPendingName};
const TITLES={UNAUTHENTICATED_INTRO:'intro',UNAUTHENTICATED_NAME:'nameTitle',UNAUTHENTICATED_SIGN_IN:'signIn',AUTHENTICATED_PROFILE_REQUIRED:'personal',AUTHENTICATED_CYCLE_STEP:'cycle',FIRST_SHINKA_DEPENDENCY:'preparation',INACTIVE_ACCOUNT:'inactive'};
const STEPS=Object.keys(TITLES);
/** @param {{state:string,initialLanguage?:string,today?:string,profile?:any,request?:Function,onState?:Function,onLanguage?:Function,pending?:typeof DEFAULT_PENDING,authenticate?:typeof beginProviderAuth,dependencies?:string[]}} props */
export default function OnboardingScreen({state,initialLanguage='en',today=null,profile=null,request=onboardingRequest,onState=()=>{},onLanguage=()=>{},pending=DEFAULT_PENDING,authenticate=beginProviderAuth,dependencies=[]}) {
  const [language,setLanguage]=useState(initialLanguage),[name,setName]=useState(()=>pending.read()??profile?.display_name??''),[form,setForm]=useState({birth_date:profile?.birth_date||'',birth_time:profile?.birth_time||'',period_start_date:'',period_duration_days:'',initial_cycle_length_days:'',health_consent:false});
  const [birthplace,setBirthplace]=useState({selection:profile?.birthplace_geonames_id?profile:null,incomplete:false});
  const [busy,setBusy]=useState(false),[error,setError]=useState(null);
  const title=useRef(null),lock=useRef(false),action=useRef(null);
  const t=key=>onboardingCopy(key,language);
  useEffect(()=>{setError(null);title.current?.focus();},[state]);
  useEffect(()=>{if(error?.field&&!busy)title.current?.ownerDocument.getElementById(error.field)?.focus();},[error,busy]);
  const showError=e=>{setError({code:e.code||'ONBOARDING_OPERATION_FAILED',field:e.field||null});};
  const run=async(fn)=>{if(lock.current)return;lock.current=true;setBusy(true);setError(null);try{await fn();}catch(e){showError(e);}finally{lock.current=false;setBusy(false);}};
  const submit=async(actionName,payload)=>{
    const key=JSON.stringify([actionName,payload]);
    if(action.current?.key!==key)action.current={key,id:crypto.randomUUID()};
    const result=await request(actionName,{...payload,action_id:action.current.id});
    if(result.persisted&&actionName==='saveProfile')pending.clear();
    if(result.profile)setName(result.profile.display_name||'');
    onState(result.state,result);
  };
  const update=(key,value)=>{setForm(v=>({...v,[key]:value}));setError(null);};
  const fieldError=key=>error?.field===key?<p id={`${key}-error`} role="alert" className="text-shinka-small text-shinka-ink">{t(error.code)}</p>:null;
  const field=(key,type='text',extra={})=><div className="space-y-2" key={key}><label htmlFor={key}>{t(key)}</label><ShinkaInput id={key} type={type} value={form[key]} onChange={e=>update(key,e.target.value)} aria-invalid={error?.field===key} aria-describedby={error?.field===key?`${key}-error`:undefined} disabled={busy} {...extra}/>{fieldError(key)}</div>;
  const body=()=>{
    if(state==='UNAUTHENTICATED_INTRO')return <><div aria-hidden="true" className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-shinka-lavender"><Sparkles className="h-12 w-12 text-shinka-plum"/></div><p className="text-center text-shinka-taupe">{t('birthChart')}</p><ShinkaButton className="w-full" onClick={()=>onState('UNAUTHENTICATED_NAME')}>{t('begin')}</ShinkaButton></>;
    if(state==='UNAUTHENTICATED_NAME')return <><label htmlFor="display_name">{t('display_name')}</label><ShinkaInput id="display_name" autoComplete="given-name" value={name} onChange={e=>{setName(e.target.value);setError(null);}} aria-invalid={error?.field==='display_name'} aria-describedby={error?.field==='display_name'?'display_name-error':undefined}/>{fieldError('display_name')}<ShinkaButton className="w-full" onClick={()=>run(async()=>{const value=optionalName(name);if(!pending.save(value)&&value)throw new OnboardingError('TRANSIENT_STORAGE_UNAVAILABLE');onState('UNAUTHENTICATED_SIGN_IN');})}>{t('continue')}</ShinkaButton><ShinkaButton variant="ghost" className="w-full" onClick={()=>{pending.clear();setName('');onState('UNAUTHENTICATED_SIGN_IN');}}>{t('preferNot')}</ShinkaButton></>;
    if(state==='UNAUTHENTICATED_SIGN_IN')return <SignIn language={language} authenticate={authenticate}/>;
    if(state==='AUTHENTICATED_PROFILE_REQUIRED')return <form className="space-y-5" noValidate onSubmit={e=>{e.preventDefault();run(async()=>{
      validateBirthDate(form.birth_date,today);optionalBirthTime(form.birth_time);
      if(birthplace.incomplete)throw new OnboardingError('PLACE_SELECTION_INCOMPLETE','birthplace');
      await submit('saveProfile',{display_name:optionalName(name),birth_date:form.birth_date,birth_time:form.birth_time||null,birthplace_geonames_id:birthplace.selection?.birthplace_geonames_id??null});
    });}}>
      {field('birth_date','date',{required:true,max:today||undefined})}{field('birth_time','time')}
      <BirthplacePicker language={language} request={request} selection={birthplace.selection} disabled={busy} error={error?.field==='birthplace'} onChange={value=>{setBirthplace(value);setError(null);}}/>
      {fieldError('birthplace')}
      <ShinkaButton type="submit" className="w-full" disabled={busy}>{t('continue')}</ShinkaButton>
    </form>;
    if(state==='AUTHENTICATED_CYCLE_STEP')return <form className="space-y-5" noValidate onSubmit={e=>{e.preventDefault();run(async()=>{validateCycleInput(form,today);await submit('saveCycle',{period_start_date:form.period_start_date||null,period_duration_days:form.period_duration_days||null,initial_cycle_length_days:form.initial_cycle_length_days||null,health_consent:form.health_consent});});}}>
      {field('period_start_date','date',{max:today||undefined})}{field('period_duration_days','number',{placeholder:'5',min:1,max:10,step:1})}{field('initial_cycle_length_days','number',{placeholder:'28',min:15,max:60,step:1})}
      <label className="flex min-h-11 items-center gap-3" htmlFor="health_consent"><input id="health_consent" type="checkbox" checked={form.health_consent} onChange={e=>update('health_consent',e.target.checked)} disabled={busy} className="h-6 w-6 shrink-0 accent-shinka-plum" aria-describedby={error?.field==='health_consent'?'health_consent-error':undefined}/>{t('health_consent')}</label>{fieldError('health_consent')}
      <ShinkaButton type="submit" className="w-full" disabled={busy}>{t('continue')}</ShinkaButton><ShinkaButton variant="ghost" className="w-full" disabled={busy} onClick={()=>run(async()=>{const result=await request('skipCycle');onState(result.state,result);})}>{t('skip')}</ShinkaButton>
    </form>;
    if(state==='FIRST_SHINKA_DEPENDENCY')return <><p>{t('preparing')}</p><p role="status" className="break-words text-shinka-small" data-dependency="FIRST_SHINKA_ENGINE_REQUIRED">FIRST_SHINKA_ENGINE_REQUIRED</p></>;
    return null;
  };
  const message=error?(t(error.code)==='COPY_KEY_MISSING'?t('saveError'):t(error.code)):null;
  return <PageContainer><main className="mx-auto max-w-md space-y-6 py-6" data-onboarding-state={state} lang={language}>
    <div className="flex items-center justify-between"><span className="font-heading text-2xl">Shinka</span><div className="flex gap-1">{['tr','en'].map(lang=><ShinkaButton key={lang} variant="ghost" aria-pressed={language===lang} onClick={()=>{setLanguage(lang);onLanguage(lang);}}>{lang.toUpperCase()}</ShinkaButton>)}</div></div>
    <>
      {dependencies.length>0&&<div role="status" className="break-words text-shinka-small">{dependencies.join(' · ')}</div>}
      <p aria-hidden="true" className="text-shinka-small text-shinka-taupe">{Math.min(STEPS.indexOf(state)+1,6)} / 6</p>
      <h1 ref={title} tabIndex={-1} className="font-heading text-[34px] leading-10 text-shinka-plum-deep outline-none">{t(TITLES[state])}</h1>
      <ShinkaCard><div className="space-y-5" aria-busy={busy}>{body()}{error&&!error.field&&<div role="alert"><p>{message}</p><p className="mt-2 break-words text-shinka-small" data-onboarding-error={error.code}>{error.code}</p></div>}</div></ShinkaCard>
    </>
  </main></PageContainer>;
}

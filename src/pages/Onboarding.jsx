import { lazy, useCallback, useEffect, useRef, useState } from 'react';
import RouteBoundary from '@/components/RouteBoundary';
import { useAuth } from '@/lib/AuthContext';
import { resolveLanguage } from '@/foundation/i18n/strings';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
import { onboardingRequest } from '@/services/onboardingService';
import PageContainer from '@/components/shinka/PageContainer';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import Home from './Home';
import ProfileAccess from '@/components/profile/ProfileAccess';
import { persistProductLanguage, isYouPrivacyError } from '@/services/youService';
import { validTimezone } from '../../base44/shared/onboardingValidation.js';
const You = lazy(() => import('./You'));
const Pattern = lazy(() => import('./Pattern'));
const Calendar = lazy(() => import('./Calendar'));
const OnboardingScreen = lazy(() => import('@/features/onboarding/OnboardingScreen'));
export default function Onboarding({initialEntry='UNAUTHENTICATED_INTRO',destination='home'}){
  const {user,isAuthenticated,isAdmin,logout}=useAuth();
  const [snapshot,setSnapshot]=useState(null),[entry,setEntry]=useState(initialEntry),[error,setError]=useState(''),[language,setLanguage]=useState(resolveLanguage);
  const generation=useRef(0),initialization=useRef(crypto.randomUUID());
  useEffect(()=>{setEntry(initialEntry);},[initialEntry]);
  const load=useCallback(async()=>{
    const ticket=++generation.current;setError('');setSnapshot(null);
    try {
      let value=await onboardingRequest('hydrate');
      if(ticket!==generation.current)return;
      if(value.state!=='INACTIVE_ACCOUNT'&&(!value.preferences||!validTimezone(value.preferences.timezone))){
        let timezone=null;try{timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch{/* Backend requires retry; no fake timezone. */}
        await onboardingRequest('initialize',{language_code:language,timezone,action_id:initialization.current});
        value=await onboardingRequest('hydrate');
      }
      if(ticket===generation.current)setSnapshot({...value,ownerSession:user.id});
    }catch(e){if(ticket===generation.current)setError(e.code);}
  },[language,user?.id]);
  useEffect(()=>{if(isAuthenticated)load();else {generation.current++;setSnapshot(null);}return()=>{generation.current++;};},[isAuthenticated,user?.id,load]);
  useEffect(()=>{
    const invalidate=()=>{generation.current++;setSnapshot(null);if(isAuthenticated)void load();};
    window.addEventListener('shinka-health-access-changed',invalidate);
    return()=>window.removeEventListener('shinka-health-access-changed',invalidate);
  },[isAuthenticated,load]);
  const saveProductLanguage = async next => {
    const ticket = generation.current;
    let result;
    try { result = await persistProductLanguage(next); }
    catch(error) {
      if(ticket===generation.current&&isYouPrivacyError(error.code)){setSnapshot(null);void load();}
      throw error;
    }
    if(ticket===generation.current)setSnapshot(s=>({...s,uiLanguage:result.preferences.language_code,preferences:result.preferences}));
  };
  if(!isAuthenticated)return <RouteBoundary><OnboardingScreen state={entry} initialLanguage={language} onState={setEntry} onLanguage={setLanguage}/></RouteBoundary>;
  if(!snapshot||snapshot.ownerSession!==user?.id)return <PageContainer><header className="flex items-center justify-between mx-auto max-w-md pt-6"><span className="font-heading text-2xl">Shinka</span><ProfileAccess language={language}/></header><main className="mx-auto max-w-md space-y-5 py-10" aria-busy={!error}>
    {error?<><p role="alert">{onboardingCopy('systemError',language)}</p><p className="break-words text-shinka-small">{error}</p><ShinkaButton onClick={load}>{onboardingCopy('retry',language)}</ShinkaButton></>:<p role="status" aria-label="Shinka">…</p>}
  </main></PageContainer>;
  if(snapshot.state==='ACTIVE_EXISTING_USER') {
    const displayLanguage = snapshot.uiLanguage||snapshot.preferences?.language_code||language;
    if(destination==='you')return <RouteBoundary><You key={user.id} language={displayLanguage} isAdmin={isAdmin} onLogout={logout} onLoaded={value=>setSnapshot(s=>({...s,profile:value.profile,preferences:value.preferences,uiLanguage:value.preferences.language_code}))} onSaved={value=>setSnapshot(s=>({...s,profile:value.profile,preferences:value.preferences,uiLanguage:value.preferences.language_code}))} renderProfileAccess={lang=><ProfileAccess language={lang} productReady/>}/></RouteBoundary>;
    if(destination==='pattern')return <RouteBoundary><Pattern key={user.id} language={displayLanguage} renderProfileAccess={lang=><ProfileAccess language={lang} productReady/>} onLanguageChange={saveProductLanguage} /></RouteBoundary>;
    if(destination==='calendar')return <RouteBoundary><Calendar key={user.id} language={displayLanguage} renderProfileAccess={lang=><ProfileAccess language={lang} productReady/>} onLanguageChange={saveProductLanguage} /></RouteBoundary>;
    return <Home key={user.id} language={displayLanguage} initialDaily={snapshot.daily?snapshot:null} profile={snapshot.profile} renderProfileAccess={lang=><ProfileAccess language={lang} productReady/>} onLanguageChange={saveProductLanguage} />;
  }
  return <RouteBoundary><OnboardingScreen renderProfileAccess={lang=><ProfileAccess language={lang}/>} key={user.id} state={snapshot.state} initialLanguage={snapshot.preferences?.language_code||language} today={snapshot.today} profile={snapshot.profile} dependencies={snapshot.dependencies||[]} onState={(state,result)=>setSnapshot(s=>({...s,...result,state}))}/></RouteBoundary>;
}

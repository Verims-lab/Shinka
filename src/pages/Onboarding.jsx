import { lazy, useCallback, useEffect, useRef, useState } from 'react';
import RouteBoundary from '@/components/RouteBoundary';
import { useAuth } from '@/lib/AuthContext';
import { resolveLanguage } from '@/foundation/i18n/strings';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
import { onboardingRequest } from '@/services/onboardingService';
import OnboardingScreen from '@/features/onboarding/OnboardingScreen';
import PageContainer from '@/components/shinka/PageContainer';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import Home from './Home';
import ProfileAccess from '@/components/profile/ProfileAccess';
import { validTimezone } from '../../base44/shared/onboardingValidation.js';
const Pattern = lazy(() => import('./Pattern'));
const Calendar = lazy(() => import('./Calendar'));
export default function Onboarding({initialEntry='UNAUTHENTICATED_INTRO',destination='home'}){
  const {user,isAuthenticated}=useAuth();
  const [snapshot,setSnapshot]=useState(null),[entry,setEntry]=useState(initialEntry),[error,setError]=useState(''),[language,setLanguage]=useState(resolveLanguage);
  const generation=useRef(0),initialization=useRef(crypto.randomUUID());
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
      if(ticket===generation.current)setSnapshot(value);
    }catch(e){if(ticket===generation.current)setError(e.code);}
  },[language]);
  useEffect(()=>{if(isAuthenticated)load();else {generation.current++;setSnapshot(null);}return()=>{generation.current++;};},[isAuthenticated,user?.id,load]);
  if(!isAuthenticated)return <OnboardingScreen state={entry} initialLanguage={language} onState={setEntry} onLanguage={setLanguage}/>;
  if(!snapshot)return <PageContainer><header className="flex items-center justify-between mx-auto max-w-md pt-6"><span className="font-heading text-2xl">Shinka</span><ProfileAccess language={language}/></header><main className="mx-auto max-w-md space-y-5 py-10" aria-busy={!error}>
    {error?<><p role="alert">{onboardingCopy('systemError',language)}</p><p className="break-words text-shinka-small">{error}</p><ShinkaButton onClick={load}>{onboardingCopy('retry',language)}</ShinkaButton></>:<p role="status" aria-label="Shinka">…</p>}
  </main></PageContainer>;
  if(snapshot.state==='ACTIVE_EXISTING_USER') {
    const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
    const displayLanguage = ['tr','en'].includes(requestedLanguage) ? requestedLanguage : snapshot.uiLanguage||snapshot.preferences?.language_code||language;
    if(destination==='pattern')return <RouteBoundary><Pattern key={user.id} language={displayLanguage} renderProfileAccess={lang=><ProfileAccess language={lang}/>} /></RouteBoundary>;
    if(destination==='calendar')return <RouteBoundary><Calendar key={user.id} language={displayLanguage} renderProfileAccess={lang=><ProfileAccess language={lang}/>} /></RouteBoundary>;
    return <Home key={user.id} language={displayLanguage} initialDaily={snapshot.daily?snapshot:null} profile={snapshot.profile} renderProfileAccess={lang=><ProfileAccess language={lang}/>} />;
  }
  return <OnboardingScreen renderProfileAccess={lang=><ProfileAccess language={lang}/>} key={user.id} state={snapshot.state} initialLanguage={snapshot.preferences?.language_code||language} today={snapshot.today} profile={snapshot.profile} dependencies={snapshot.dependencies||[]} onState={(state,result)=>setSnapshot(s=>({...s,...result,state}))}/>;
}

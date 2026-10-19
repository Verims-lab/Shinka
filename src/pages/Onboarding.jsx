import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { resolveLanguage } from '@/foundation/i18n/strings';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
import { onboardingRequest } from '@/services/onboardingService';
import OnboardingScreen from '@/features/onboarding/OnboardingScreen';
import PageContainer from '@/components/shinka/PageContainer';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import Home from './Home';
import { validTimezone } from '../../base44/shared/onboardingValidation.js';
export default function Onboarding({initialEntry='UNAUTHENTICATED_INTRO'}){
  const {user,isAuthenticated}=useAuth();
  const [snapshot,setSnapshot]=useState(null),[entry,setEntry]=useState(initialEntry),[error,setError]=useState(''),[language,setLanguage]=useState(resolveLanguage);
  const generation=useRef(0),initialization=useRef(crypto.randomUUID());
  const load=useCallback(async()=>{
    const ticket=++generation.current;setError('');setSnapshot(null);
    try {
      let value=await onboardingRequest('hydrate');
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
  if(!snapshot)return <PageContainer><main className="mx-auto max-w-md space-y-5 py-10" aria-busy={!error}>
    {error?<><p role="alert">{onboardingCopy('systemError',language)}</p><p className="break-words text-shinka-small">{error}</p><ShinkaButton onClick={load}>{onboardingCopy('retry',language)}</ShinkaButton></>:<p role="status" aria-label="Shinka">…</p>}
  </main></PageContainer>;
  if(snapshot.state==='ACTIVE_EXISTING_USER')return <Home/>;
  return <OnboardingScreen key={user.id} state={snapshot.state} initialLanguage={snapshot.preferences?.language_code||language} today={snapshot.today} profile={snapshot.profile} dependencies={snapshot.dependencies||[]} onState={(state,result)=>setSnapshot(s=>({...s,...result,state}))}/>;
}

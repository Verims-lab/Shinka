import { lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import SessionRetry from '@/components/SessionRetry';
import RouteBoundary from '@/components/RouteBoundary';
import { useAuth } from '@/lib/AuthContext';
import { resolveLanguage } from '@/foundation/i18n/strings';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
import { onboardingRequest, assertOnboardingSnapshot, isOnboardingPrivacyRestriction } from '@/services/onboardingService';
import PageContainer from '@/components/shinka/PageContainer';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import Home from './Home';
import ProfileAccess from '@/components/profile/ProfileAccess';
import { validTimezone } from '../../base44/shared/onboardingValidation.js';
import { applyAppTheme } from '@/lib/appTheme';
import ProductTabs from '@/components/shinka/ProductTabs';
const You = lazy(() => import('./You'));
const Pattern = lazy(() => import('./Pattern'));
const Calendar = lazy(() => import('./Calendar'));
const OnboardingScreen = lazy(() => import('@/features/onboarding/OnboardingScreen'));
export default function Onboarding({initialEntry='UNAUTHENTICATED_INTRO',destination='home',request=onboardingRequest}){
  const {user,isAuthenticated,isAdmin,logout,authError,isLoadingAuth,isLoadingPublicSettings}=useAuth();
  const [snapshot,setSnapshot]=useState(null),[entry,setEntry]=useState(initialEntry),[error,setError]=useState(''),[language]=useState(resolveLanguage);
  const [admissionEpoch,setAdmissionEpoch]=useState(0);
  const generation=useRef(0),initialization=useRef(crypto.randomUUID());
  useEffect(()=>{setEntry(initialEntry);},[initialEntry]);
  const load=useCallback(async()=>{
    const ticket=++generation.current;setError('');setSnapshot(null);
    try {
      let value=assertOnboardingSnapshot(await request('hydrate'));
      if(ticket!==generation.current)return;
      if(value.state!=='INACTIVE_ACCOUNT'&&(!value.preferences||!validTimezone(value.preferences.timezone))){
        let timezone=null;try{timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch{/* Backend requires retry; no fake timezone. */}
        await request('initialize',{language_code:resolveLanguage(value.preferences?.language_code),timezone,action_id:initialization.current});
        if(ticket!==generation.current)return;
        value=assertOnboardingSnapshot(await request('hydrate'));
      }
      if(ticket===generation.current)setSnapshot({...value,ownerSession:user.id});
    }catch(e){if(ticket===generation.current)setError(e.code || 'ONBOARDING_OPERATION_FAILED');}
  },[language,user?.id,request]);
  useEffect(()=>{
    // Even a synchronously coalesced same-owner re-admission seals old product
    // controllers. Force a new verified snapshot rather than retaining a sealed view.
    const ended=()=>{generation.current++;setSnapshot(null);setError('');setAdmissionEpoch(value=>value+1);};
    window.addEventListener('shinka-session-ended',ended);
    return()=>window.removeEventListener('shinka-session-ended',ended);
  },[]);
  useEffect(()=>{if(isAuthenticated&&!isLoadingAuth&&!isLoadingPublicSettings)load();else {generation.current++;setSnapshot(null);}return()=>{generation.current++;};},[isAuthenticated,isLoadingAuth,isLoadingPublicSettings,user?.id,admissionEpoch,load]);
  useEffect(()=>{
    const invalidate=()=>{generation.current++;setSnapshot(null);if(isAuthenticated)void load();};
    window.addEventListener('shinka-health-access-changed',invalidate);
    return()=>window.removeEventListener('shinka-health-access-changed',invalidate);
  },[isAuthenticated,load]);
  // Only a verified snapshot of the current owner may select dark; logout,
  // account switch, loading and onboarding all resolve to the light default.
  const ownTheme=isAuthenticated&&!authError&&!isLoadingAuth&&!isLoadingPublicSettings&&snapshot?.ownerSession===user?.id&&snapshot?.state==='ACTIVE_EXISTING_USER'?snapshot.preferences?.theme_code:null;
  useEffect(()=>{applyAppTheme(ownTheme);},[ownTheme]);
  if(authError?.type==='lifecycle_restricted'||isOnboardingPrivacyRestriction(error))return <Navigate to="/account-privacy" replace/>;
  if(authError?.type==='session_unverified'&&!snapshot)return <SessionRetry/>;
  if(isLoadingAuth||isLoadingPublicSettings)return <PageContainer><p role="status" aria-label="Shinka">…</p></PageContainer>;
  if(!isAuthenticated)return <RouteBoundary><OnboardingScreen state={entry} initialLanguage={language} onState={setEntry}/></RouteBoundary>;
  if(!snapshot||snapshot.ownerSession!==user?.id)return <PageContainer><header className="flex items-center justify-between mx-auto max-w-md pt-6"><span className="font-heading text-2xl">Shinka</span></header><main className="mx-auto max-w-md space-y-5 py-10" aria-busy={!error}>
    {error?<><p role="alert">{onboardingCopy('systemError',language)}</p><p className="break-words text-shinka-small">{error}</p><ShinkaButton onClick={load}>{onboardingCopy('retry',language)}</ShinkaButton></>:<p role="status" aria-label="Shinka">…</p>}
  </main></PageContainer>;
  if(snapshot.state==='ACTIVE_EXISTING_USER') {
    const displayLanguage = snapshot.uiLanguage||snapshot.preferences?.language_code||language;
    const youPage=destination==='you'&&<RouteBoundary><You key={user.id} language={displayLanguage} isAdmin={isAdmin} onLogout={logout} onLoaded={value=>setSnapshot(s=>({...s,profile:value.profile,preferences:value.preferences,uiLanguage:value.preferences.language_code}))} onSaved={value=>setSnapshot(s=>({...s,profile:value.profile,preferences:value.preferences,uiLanguage:value.preferences.language_code}))} renderProfileAccess={lang=><ProfileAccess language={lang} productReady/>}/></RouteBoundary>;
    const access=lang=><ProfileAccess language={lang} productReady/>;
    const tabs=<ProductTabs key={user.id} destination={destination} render={(tab,active)=>tab==='pattern'?<RouteBoundary><Pattern language={displayLanguage} active={active} renderProfileAccess={access}/></RouteBoundary>
      :tab==='calendar'?<RouteBoundary><Calendar language={displayLanguage} active={active} renderProfileAccess={access}/></RouteBoundary>
      :<Home language={displayLanguage} active={active} initialDaily={snapshot.daily?snapshot:null} profile={snapshot.profile} renderProfileAccess={access}/>}/>;
    if(destination==='you')return <>{youPage}{tabs}</>;
    return tabs;
  }
  return <RouteBoundary><OnboardingScreen authenticated onRestricted={code=>{generation.current++;setSnapshot(null);setError(code);}} request={request} key={user.id} state={snapshot.state} initialLanguage={snapshot.preferences?.language_code||language} today={snapshot.today} profile={snapshot.profile} dependencies={snapshot.dependencies||[]} onState={(state,result)=>setSnapshot(s=>s?.ownerSession===user.id?{...s,...result,state}:s)}/></RouteBoundary>;
}

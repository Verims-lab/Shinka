import { useState } from 'react';
import { beginProviderAuth } from '@/services/authService';
import OnboardingScreen from '@/features/onboarding/OnboardingScreen';
import { onboardingFixture } from './onboardingFixture';
import { onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
const unavailableDaily = async () => { throw Object.assign(new Error(), { code: 'DAILY_ATOMIC_CAPABILITY_REQUIRED' }); };
export default function OnboardingFixture({step='UNAUTHENTICATED_INTRO',language='en',requestOverride=null,pendingOverride=null,profileOverride=null,dailyRequestOverride=null}){
  const [state,setState]=useState(step),[fixture]=useState(()=>onboardingFixture({complete:step==='AUTHENTICATED_CYCLE_STEP'}));
  const [pending]=useState(()=>{let name=null;return {read:()=>name,save:value=>{name=value;return true;},clear:()=>{name=null;}};});
  const [dependencies,setDependencies]=useState([]);
  const request=async(action,payload={})=>onboardingOperation(fixture.client,{...payload,action},fixture.dependencies);
  return <OnboardingScreen authenticated={step.startsWith("AUTHENTICATED")||step==='FIRST_SHINKA_DEPENDENCY'} dailyRequest={dailyRequestOverride||unavailableDaily} profile={profileOverride} state={state} today="2026-10-19" initialLanguage={language} request={requestOverride||request} onState={(next,result)=>{setState(next);setDependencies(result?.dependencies||[]);}} dependencies={dependencies} pending={pendingOverride||pending} authenticate={(provider,url,checked)=>beginProviderAuth(provider,url,checked,{loginWithProvider:async()=>{throw new Error('SYNTHETIC_NO_PROVIDER');}})}/>;
}

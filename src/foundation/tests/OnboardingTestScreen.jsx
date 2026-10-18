import { useState } from 'react';
import { beginProviderAuth } from '@/services/authService';
import OnboardingScreen from '@/features/onboarding/OnboardingScreen';
import { onboardingFixture } from './onboardingFixture';
import { onboardingOperation } from '../../../base44/shared/onboardingOperations.js';
export default function OnboardingFixture({step='UNAUTHENTICATED_INTRO',language='en'}){
  const [state,setState]=useState(step),[fixture]=useState(()=>onboardingFixture({complete:step==='AUTHENTICATED_CYCLE_STEP'}));
  const [pending]=useState(()=>{let name=null;return {read:()=>name,save:value=>{name=value;return true;},clear:()=>{name=null;}};});
  const request=async(action,payload={})=>onboardingOperation(fixture.client,{...payload,action},fixture.dependencies);
  return <OnboardingScreen state={state} today="2026-10-19" initialLanguage={language} request={request} onState={setState} pending={pending} authenticate={(provider,url,checked)=>beginProviderAuth(provider,url,checked,{loginWithProvider:async()=>{throw new Error('SYNTHETIC_NO_PROVIDER');}})}/>;
}

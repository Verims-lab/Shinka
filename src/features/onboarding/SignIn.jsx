import { useEffect, useRef, useState } from 'react';
import { Apple } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { beginProviderAuth } from '@/services/authService';
import { safeReturnTo } from '@/lib/authReturnTo';
import { termsCopy } from '@/foundation/i18n/termsCopy';
import { termsRequest, validateProviderDeclarations } from '@/services/termsService';
import LegalDeclarations from './LegalDeclarations';
export default function SignIn({language='en',authenticate=beginProviderAuth,onBusy=(_busy)=>{},loadPolicy=(signal)=>termsRequest('policy',{},undefined,15000,{signal}),onAuthenticated=undefined,legalLinks=undefined}) {
  const [checked,setChecked]=useState(false),[terms,setTerms]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[version,setVersion]=useState(null),[policyError,setPolicyError]=useState(''),[policyBusy,setPolicyBusy]=useState(false);
  const lock=useRef(false),mounted=useRef(false),checkbox=useRef(null),policyLock=useRef(false),policyVersion=useRef(null),policyRefresh=useRef(null),policyRequest=useRef(null),t=key=>termsCopy(key,language);
  const refreshPolicy=async()=>{
    if(policyLock.current||lock.current)return;
    policyLock.current=true;setPolicyBusy(true);
    try{
      policyRequest.current?.abort();policyRequest.current=new AbortController();
      const policy=await loadPolicy(policyRequest.current.signal);
      if(!mounted.current)return;
      if(policy.version!==policyVersion.current){setTerms(false);policyVersion.current=policy.version;}
      setVersion(policy.version);setPolicyError(policy.state==='READY'?'':'TERMS_CONFIGURATION_REQUIRED');
    }catch(failure){if(mounted.current){setVersion(null);setPolicyError(failure.code||'TERMS_STATE_UNAVAILABLE');}}
    finally{policyLock.current=false;if(mounted.current)setPolicyBusy(false);}
  };
  policyRefresh.current=refreshPolicy;
  useEffect(()=>{
    mounted.current=true;void refreshPolicy();
    const refresh=()=>{if(document.visibilityState==='visible')void policyRefresh.current();};
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{mounted.current=false;policyRequest.current?.abort();window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[]);
  const signIn=async provider=>{
    if(lock.current)return;
    const declarations={termsConfirmed:terms,version};
    const invalid=validateProviderDeclarations(checked,declarations);
    if(invalid==='TERMS_CONFIGURATION_REQUIRED'&&policyError){setError('');return;}
    if(invalid){setError(invalid);(invalid==='AGE_DECLARATION_REQUIRED'?checkbox.current:checkbox.current?.ownerDocument.getElementById('terms-declaration'))?.focus();return;}
    lock.current=true;setBusy(true);onBusy(true);setError('');
    const destination=safeReturnTo();
    let authenticated=false;
    try {
      const result=await authenticate(provider,destination==='/'?'/login':destination,checked,undefined,declarations);
      authenticated=result.ok===true;
      if(mounted.current&&!result.ok&&result.code!=='AUTH_CANCELLED'){
        setError(result.code?.startsWith('TERMS_')?result.code:'AUTH_PROVIDER_FAILED');
      }
    } catch { if(mounted.current)setError('AUTH_PROVIDER_FAILED'); }
    finally { if(mounted.current){lock.current=false;setBusy(false);onBusy(false);} }
    // Optional presentation callback runs after releasing busy state. Real OAuth
    // still owns its redirect; only an injected adapter supplies local success.
    if(mounted.current&&authenticated)onAuthenticated?.();
  };
  return <div className="shinka-sign-in space-y-4" data-auth-shell>
    <LegalDeclarations ref={checkbox} language={language} age={checked} terms={terms} busy={busy} error={error}
      links={legalLinks} onAge={value=>{setChecked(value);setError('');}} onTerms={value=>{setTerms(value);setError('');}} />
    {policyError&&<div><p role="alert" data-policy-error={policyError}>{t(policyError)}</p><ShinkaButton variant="secondary" className="w-full" data-policy-check disabled={policyBusy||busy} onClick={refreshPolicy}>{t(policyBusy?'termsChecking':'termsCheck')}</ShinkaButton></div>}
    <ShinkaButton className="w-full" disabled={busy} onClick={()=>signIn('apple')} data-provider="apple"><Apple aria-hidden="true" className="h-5 w-5"/>{t('apple')}</ShinkaButton>
    <ShinkaButton className="w-full" disabled={busy} onClick={()=>signIn('google')} data-provider="google"><GoogleIcon className="h-5 w-5"/>{t('google')}</ShinkaButton>
    {error&&!['AGE_DECLARATION_REQUIRED','TERMS_CONFIRMATION_REQUIRED'].includes(error)&&<p role="alert" data-error-code={error}>{t(error)==='COPY_KEY_MISSING'?t('TERMS_STATE_UNAVAILABLE'):t(error)}</p>}
  </div>;
}

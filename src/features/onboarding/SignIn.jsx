import { useEffect, useRef, useState } from 'react';
import { Apple } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { beginProviderAuth } from '@/services/authService';
import { safeReturnTo } from '@/lib/authReturnTo';
import { termsCopy } from '@/foundation/i18n/termsCopy';
import { termsRequest, validateAuthDeclarations } from '@/services/termsService';
import LegalDeclarations from './LegalDeclarations';
export default function SignIn({language='en',authenticate=beginProviderAuth,onBusy=(_busy)=>{},loadPolicy=()=>termsRequest('policy')}) {
  const [checked,setChecked]=useState(false),[terms,setTerms]=useState(false),[returning,setReturning]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[version,setVersion]=useState(null);
  const lock=useRef(false),mounted=useRef(false),checkbox=useRef(null),t=key=>termsCopy(key,language);
  useEffect(()=>{
    mounted.current=true;
    loadPolicy().then(policy=>{if(mounted.current)setVersion(policy.version);}).catch(()=>{ /* Submit fails closed; returning identity can still be verified. */ });
    return()=>{mounted.current=false;};
  },[]);
  const signIn=async provider=>{
    if(lock.current)return;
    const declarations={termsConfirmed:terms,returning,version};
    const invalid=validateAuthDeclarations(checked,declarations);
    if(invalid){setError(invalid);(invalid==='AGE_DECLARATION_REQUIRED'?checkbox.current:checkbox.current?.ownerDocument.getElementById('terms-declaration'))?.focus();return;}
    lock.current=true;setBusy(true);onBusy(true);setError('');
    const destination=safeReturnTo();
    try {
      const result=await authenticate(provider,destination==='/'?'/login':destination,checked,undefined,declarations);
      if(mounted.current&&!result.ok&&result.code!=='AUTH_CANCELLED'){
        setError(result.code?.startsWith('TERMS_')?result.code:'AUTH_PROVIDER_FAILED');
      }
    } catch { if(mounted.current)setError('AUTH_PROVIDER_FAILED'); }
    finally { if(mounted.current){lock.current=false;setBusy(false);onBusy(false);} }
  };
  return <div className="shinka-sign-in space-y-4" data-auth-shell>
    <LegalDeclarations ref={checkbox} language={language} age={checked} terms={terms} returning={returning} busy={busy} error={error}
      onAge={value=>{setChecked(value);setError('');}} onTerms={value=>{setTerms(value);setError('');}} />
    {returning&&<p className="text-shinka-small" role="status">{t('returningTermsCheck')}</p>}
    <ShinkaButton className="w-full" disabled={busy} onClick={()=>signIn('apple')} data-provider="apple"><Apple aria-hidden="true" className="h-5 w-5"/>{t('apple')}</ShinkaButton>
    <ShinkaButton className="w-full" disabled={busy} onClick={()=>signIn('google')} data-provider="google"><GoogleIcon className="h-5 w-5"/>{t('google')}</ShinkaButton>
    <ShinkaButton variant="ghost" className="w-full" disabled={busy} data-auth-returning onClick={()=>{setReturning(!returning);setChecked(false);setTerms(false);setError('');}}>{t(returning?'newAccount':'existingAccount')}</ShinkaButton>
    {error&&!['AGE_DECLARATION_REQUIRED','TERMS_CONFIRMATION_REQUIRED'].includes(error)&&<p role="alert" data-error-code={error}>{t(error)==='COPY_KEY_MISSING'?t('TERMS_STATE_UNAVAILABLE'):t(error)}</p>}
  </div>;
}

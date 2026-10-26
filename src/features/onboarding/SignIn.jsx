import { useEffect, useRef, useState } from 'react';
import { Apple } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { beginProviderAuth } from '@/services/authService';
import { safeReturnTo } from '@/lib/authReturnTo';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
export default function SignIn({language='en',authenticate=beginProviderAuth,onBusy=(_busy)=>{}}) {
  const [checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const lock=useRef(false),mounted=useRef(false),checkbox=useRef(null),t=key=>onboardingCopy(key,language);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const signIn=async provider=>{
    if(lock.current)return;lock.current=true;setBusy(true);onBusy(true);setError('');
    const destination=safeReturnTo();
    try {
      const result=await authenticate(provider,destination==='/'?'/login':destination,checked);
      if(mounted.current&&!result.ok&&result.code!=='AUTH_CANCELLED'){
        setError(result.code==='AGE_DECLARATION_REQUIRED'?result.code:'AUTH_PROVIDER_FAILED');
        if(!checked)checkbox.current?.focus();
      }
    } catch { if(mounted.current)setError('AUTH_PROVIDER_FAILED'); }
    finally { if(mounted.current){lock.current=false;setBusy(false);onBusy(false);} }
  };
  return <div className="space-y-4" data-auth-shell>
    <label className="flex min-h-11 items-center gap-3" htmlFor="age-declaration">
      <input ref={checkbox} id="age-declaration" type="checkbox" checked={checked} disabled={busy} onChange={e=>{setChecked(e.target.checked);setError('');}} aria-describedby={error==='AGE_DECLARATION_REQUIRED'?'age-error':undefined} className="h-6 w-6 shrink-0 accent-shinka-plum" />{t('age')}
    </label>
    {error==='AGE_DECLARATION_REQUIRED'&&<p id="age-error" role="alert">{t(error)}</p>}
    <ShinkaButton className="w-full" disabled={busy} onClick={()=>signIn('apple')} data-provider="apple"><Apple aria-hidden="true" className="h-5 w-5"/>{t('apple')}</ShinkaButton>
    <ShinkaButton className="w-full" disabled={busy} onClick={()=>signIn('google')} data-provider="google"><GoogleIcon className="h-5 w-5"/>{t('google')}</ShinkaButton>
    {error&&error!=='AGE_DECLARATION_REQUIRED'&&<p role="alert" data-error-code={error}>{t(error)}</p>}
  </div>;
}

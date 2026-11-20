import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import PageContainer from '@/components/shinka/PageContainer';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { resolveLanguage } from '@/foundation/i18n/strings';
import { termsCopy } from '@/foundation/i18n/termsCopy';
import { BUILD_MARKER } from '@/foundation/buildMarker';
import { termsRequest, currentTerms, takeTermsIntent, validateAuthDeclarations } from '@/services/termsService';
import LegalDeclarations from './LegalDeclarations';

// Authentication is established; no personal product/admin route is mounted
// until current legal acceptance is verified by applicationSession as well.
export default function TermsGate() {
  const { user, checkAppState, checkUserAuth, logout } = useAuth();
  const language=resolveLanguage(),t=key=>termsCopy(key,language);
  const [view,setView]=useState(user?.terms),[age,setAge]=useState(false),[terms,setTerms]=useState(false);
  const [busy,setBusy]=useState(true),[error,setError]=useState(''),[unknown,setUnknown]=useState(false),[canRetry,setCanRetry]=useState(false);
  const mounted=useRef(false),lock=useRef(false),intent=useRef(null),started=useRef(false),ageInput=useRef(null),request=useRef(null),checkLatest=useRef(null),lastReturn=useRef(-Infinity);
  const success=async()=>{
    if(!mounted.current)return;
    // Refresh the existing session without destroying/remounting this gate. A
    // lagging session response must not cause an automatic read/remount loop.
    await checkUserAuth();
    if(mounted.current)setError('TERMS_SESSION_UNCONFIRMED');
  };
  const read = (action,payload={}) => {
    request.current?.abort();request.current=new AbortController();
    return termsRequest(action,payload,undefined,15000,{signal:request.current.signal});
  };
  const save=async payload=>{
    if(!mounted.current||lock.current)return;lock.current=true;setBusy(true);setError('');setCanRetry(false);
    intent.current=payload;
    try { const status=await read('accept',payload);if(!mounted.current)return;setView(status);setUnknown(false);await success(); }
    catch(failure){if(mounted.current){setError(failure.unknown?'TERMS_WRITE_UNCONFIRMED':failure.code);setUnknown(failure.unknown);setView(previous=>({...previous,state:'UNAVAILABLE'}));if(failure.code==='TERMS_VERSION_CHANGED'){setTerms(false);setAge(false);intent.current=null;setView({state:'UNAVAILABLE'});}}}
    finally{lock.current=false;if(mounted.current)setBusy(false);}
  };
  const check=async pending=>{
    if(!mounted.current||lock.current)return;lock.current=true;setBusy(true);setError('');setCanRetry(false);
    let automatic=null;
    try {
      const status=await read('status');
      if(!mounted.current)return;
      setView(status);
      if(currentTerms(status)){await success();return;}
      if(status.state==='CONFIGURATION_REQUIRED')setError('TERMS_CONFIGURATION_REQUIRED');
      if(pending&&status.state==='REQUIRED'&&pending.version===status.version)automatic={version:pending.version,confirmed:true,age_confirmed:true,intent_id:pending.nonce};
      if(status.state==='REQUIRED'&&status.version!==(intent.current?.version||view?.version)){intent.current=null;setUnknown(false);setAge(false);setTerms(false);setError('TERMS_VERSION_CHANGED');}
      else if(unknown&&status.state==='REQUIRED')setCanRetry(true);
    }catch(failure){if(mounted.current){setView(previous=>({...previous,state:'UNAVAILABLE'}));setError(failure.code);}}
    finally{lock.current=false;if(mounted.current)setBusy(false);}
    if(automatic&&mounted.current)await save(automatic);
  };
  useEffect(()=>{
    mounted.current=true;
    if(!started.current){started.current=true;void check(takeTermsIntent());}
    const seal=()=>{mounted.current=false;request.current?.abort();};
    // External document return is read-only. Coalesce focus/visibility bursts;
    // it never supplies the OAuth declaration intent or retries an acceptance.
    const refresh=()=>{
      if(document.visibilityState!=='visible'||lock.current||Date.now()-lastReturn.current<1000)return;
      lastReturn.current=Date.now();void checkLatest.current?.(null);
    };
    window.addEventListener('focus',refresh);
    window.addEventListener('pageshow',refresh);
    document.addEventListener('visibilitychange',refresh);
    window.addEventListener('shinka-session-ended',seal);
    return()=>{seal();window.removeEventListener('shinka-session-ended',seal);window.removeEventListener('focus',refresh);window.removeEventListener('pageshow',refresh);document.removeEventListener('visibilitychange',refresh);};
    // This mounted boundary belongs to exactly one authenticated user (App key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  checkLatest.current=check;
  const clearDeclarationError=()=>setError(previous=>['AGE_DECLARATION_REQUIRED','TERMS_CONFIRMATION_REQUIRED'].includes(previous)?'':previous);
  const accept=()=>{
    if(view?.state!=='REQUIRED'||unknown)return;
    const invalid=validateAuthDeclarations(age,{termsConfirmed:terms,version:view?.version});
    if(invalid){setError(invalid);(invalid==='AGE_DECLARATION_REQUIRED'?ageInput.current:document.getElementById('terms-declaration'))?.focus();return;}
    void save({version:view.version,confirmed:true,age_confirmed:true,intent_id:crypto.randomUUID()});
  };
  return <PageContainer surface="section" className="shinka-onboarding">
    <main className="mx-auto max-w-md space-y-3" data-terms-gate data-shinka-build={BUILD_MARKER} lang={language} aria-busy={busy}>
      <div className="space-y-2 text-center"><h1 className="font-heading text-shinka-h1 text-shinka-plum-deep">{t('signIn')}</h1><p className="text-shinka-taupe">{t('signInSubtitle')}</p></div>
      <div className="shinka-sign-in space-y-4">
        <p>{t('termsNeeded')}</p>
        <LegalDeclarations ref={ageInput} language={language} age={age} terms={terms} busy={busy||unknown} error={error} onAge={value=>{setAge(value);clearDeclarationError();}} onTerms={value=>{setTerms(value);clearDeclarationError();}} />
        {error&&!['AGE_DECLARATION_REQUIRED','TERMS_CONFIRMATION_REQUIRED'].includes(error)&&<p role="alert" data-terms-error={error}>{t(error)==='COPY_KEY_MISSING'?t('TERMS_STATE_UNAVAILABLE'):t(error)}</p>}
        {!unknown&&view?.state==='REQUIRED'&&<ShinkaButton className="w-full" data-terms-accept disabled={busy} onClick={accept}>{t('termsContinue')}</ShinkaButton>}
        <ShinkaButton variant="secondary" className="w-full" data-terms-check disabled={busy} onClick={()=>error==='AUTH_REQUIRED'?checkAppState():check(null)}>{t(busy?'termsChecking':error==='AUTH_REQUIRED'?'termsReauthenticate':'termsCheck')}</ShinkaButton>
        {unknown&&canRetry&&<ShinkaButton className="w-full" data-terms-retry disabled={busy} onClick={()=>save(intent.current)}>{t('termsContinueSame')}</ShinkaButton>}
        <ShinkaButton variant="ghost" className="w-full" disabled={busy} onClick={()=>logout()}>{t('signOut')}</ShinkaButton>
      </div>
    </main>
  </PageContainer>;
}

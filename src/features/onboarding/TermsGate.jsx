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
  const { user, checkAppState, logout } = useAuth();
  const language=resolveLanguage(),t=key=>termsCopy(key,language);
  const [view,setView]=useState(user?.terms),[age,setAge]=useState(false),[terms,setTerms]=useState(false);
  const [busy,setBusy]=useState(true),[error,setError]=useState(''),[unknown,setUnknown]=useState(false),[canRetry,setCanRetry]=useState(false);
  const mounted=useRef(false),lock=useRef(false),intent=useRef(null),started=useRef(false),ageInput=useRef(null);
  const success=async()=>{ if(mounted.current)await checkAppState(); };
  const save=async payload=>{
    if(lock.current)return;lock.current=true;setBusy(true);setError('');setCanRetry(false);
    intent.current=payload;
    try { await termsRequest('accept',payload); await success(); }
    catch(failure){if(mounted.current){setError(failure.unknown?'TERMS_WRITE_UNCONFIRMED':failure.code);setUnknown(failure.unknown);if(failure.code==='TERMS_VERSION_CHANGED'){setTerms(false);setAge(false);intent.current=null;setView({state:'UNAVAILABLE'});}}}
    finally{lock.current=false;if(mounted.current)setBusy(false);}
  };
  const check=async pending=>{
    if(lock.current)return;lock.current=true;setBusy(true);setError('');setCanRetry(false);
    let automatic=null;
    try {
      const status=await termsRequest('status');
      if(!mounted.current)return;
      setView(status);
      if(currentTerms(status)){await success();return;}
      if(status.state==='CONFIGURATION_REQUIRED')setError('TERMS_CONFIGURATION_REQUIRED');
      if(pending&&status.state==='REQUIRED'&&pending.version===status.version)automatic={version:pending.version,confirmed:true,age_confirmed:true,intent_id:pending.nonce};
      if(intent.current&&status.version!==intent.current.version){intent.current=null;setUnknown(false);setAge(false);setTerms(false);setError('TERMS_VERSION_CHANGED');}
      else if(unknown&&status.state==='REQUIRED')setCanRetry(true);
    }catch{if(mounted.current)setError('TERMS_STATE_UNAVAILABLE');}
    finally{lock.current=false;if(mounted.current)setBusy(false);}
    if(automatic&&mounted.current)await save(automatic);
  };
  useEffect(()=>{
    mounted.current=true;
    if(!started.current){started.current=true;void check(takeTermsIntent());}
    const seal=()=>{mounted.current=false;};
    window.addEventListener('shinka-session-ended',seal);
    return()=>{mounted.current=false;window.removeEventListener('shinka-session-ended',seal);};
    // This mounted boundary belongs to exactly one authenticated user (App key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const accept=()=>{
    const invalid=validateAuthDeclarations(age,{termsConfirmed:terms,version:view?.version});
    if(invalid){setError(invalid);(invalid==='AGE_DECLARATION_REQUIRED'?ageInput.current:document.getElementById('terms-declaration'))?.focus();return;}
    void save({version:view.version,confirmed:true,age_confirmed:true,intent_id:crypto.randomUUID()});
  };
  return <PageContainer surface="section" className="shinka-onboarding">
    <main className="mx-auto max-w-md space-y-3" data-terms-gate data-shinka-build={BUILD_MARKER} lang={language} aria-busy={busy}>
      <div className="space-y-2 text-center"><h1 className="font-heading text-shinka-h1 text-shinka-plum-deep">{t('signIn')}</h1><p className="text-shinka-taupe">{t('signInSubtitle')}</p></div>
      <div className="shinka-sign-in space-y-4">
        <p>{t('termsNeeded')}</p>
        <LegalDeclarations ref={ageInput} language={language} age={age} terms={terms} busy={busy||unknown} error={error} onAge={value=>{setAge(value);setError('');}} onTerms={value=>{setTerms(value);setError('');}} />
        {error&&!['AGE_DECLARATION_REQUIRED','TERMS_CONFIRMATION_REQUIRED'].includes(error)&&<p role="alert" data-terms-error={error}>{t(error)==='COPY_KEY_MISSING'?t('TERMS_STATE_UNAVAILABLE'):t(error)}</p>}
        {!unknown&&view?.state==='REQUIRED'&&<ShinkaButton className="w-full" data-terms-accept disabled={busy} onClick={accept}>{t('termsContinue')}</ShinkaButton>}
        <ShinkaButton variant="secondary" className="w-full" data-terms-check disabled={busy} onClick={()=>check(null)}>{t('termsCheck')}</ShinkaButton>
        {unknown&&canRetry&&<ShinkaButton className="w-full" data-terms-retry disabled={busy} onClick={()=>save(intent.current)}>{t('termsContinueSame')}</ShinkaButton>}
        <ShinkaButton variant="ghost" className="w-full" disabled={busy} onClick={()=>logout()}>{t('signOut')}</ShinkaButton>
      </div>
    </main>
  </PageContainer>;
}

import { forwardRef } from 'react';
import { termsCopy } from '@/foundation/i18n/termsCopy';
import { TERMS_URL, PRIVACY_URL } from '@/services/termsService';
const declarationType={fontSize:'.7em',lineHeight:1.5};

const LegalDeclarations = forwardRef(/** @param {{language:string,age:boolean,terms:boolean,onAge:(value:boolean)=>void,onTerms:(value:boolean)=>void,busy?:boolean,returning?:boolean,error?:string}} props @param {import('react').ForwardedRef<HTMLInputElement>} ref */ function LegalDeclarations({ language, age, terms, onAge, onTerms, busy = false, returning = false, error = '' }, ref) {
  const t = key => termsCopy(key, language);
  const link = (url, text) => <a href={url} target="_blank" rel="noopener noreferrer" className="shinka-legal-link inline-flex min-h-11 items-center underline underline-offset-4 text-shinka-plum-deep" onClick={event => event.stopPropagation()}>{text}</a>;
  const sentence = (key, phraseKey, url) => { const text=t(key),phrase=t(phraseKey),index=text.indexOf(phrase);return <>{text.slice(0,index)}{link(url,phrase)}{text.slice(index+phrase.length)}</>; };
  return <div className="shinka-legal-declarations space-y-1">
    <label className="flex min-h-11 items-center gap-3" htmlFor="age-declaration">
      <input ref={ref} id="age-declaration" type="checkbox" checked={age} disabled={busy} onChange={event => onAge(event.target.checked)} aria-describedby={error === 'AGE_DECLARATION_REQUIRED' ? 'age-error' : undefined} className="h-6 w-6 shrink-0 accent-shinka-plum" />
      <span className="shinka-declaration-copy min-w-0" style={declarationType}>{t('age')}</span>
    </label>
    {!returning && <label className="flex min-h-11 items-center gap-3" htmlFor="terms-declaration">
      <input id="terms-declaration" type="checkbox" checked={terms} disabled={busy} onChange={event => onTerms(event.target.checked)} aria-describedby={error === 'TERMS_CONFIRMATION_REQUIRED' ? 'terms-error' : undefined} className="h-6 w-6 shrink-0 accent-shinka-plum" />
      <span className="shinka-declaration-copy min-w-0" style={declarationType}>{sentence('termsAgreement','termsLink',TERMS_URL)}</span>
    </label>}
    {error === 'AGE_DECLARATION_REQUIRED' && <p id="age-error" role="alert">{t(error)}</p>}
    {error === 'TERMS_CONFIRMATION_REQUIRED' && <p id="terms-error" role="alert">{t(error)}</p>}
    <p className="shinka-privacy-information text-shinka-small">{sentence('privacyInformation','privacyLink',PRIVACY_URL)}</p>
  </div>;
});
export default LegalDeclarations;

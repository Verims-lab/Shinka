import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { resolveLanguage } from '@/foundation/i18n/strings';
import { privacyCopy } from '@/foundation/i18n/privacyCopy';
import PrivacyActions from '@/features/privacy/PrivacyActions';
import ShinkaCard from '@/components/shinka/ShinkaCard';
import { privacyRecoveryStore } from '@/services/privacyService';
import SectionBackdrop from '@/components/shinka/SectionBackdrop';

// Also an external web entry for Play's deletion pathway. Publicly discoverable;
// mutations still require the existing native provider session and confirmation.
export default function AccountPrivacy() {
  const { user, isAuthenticated, logout } = useAuth(), [params] = useSearchParams(), heading = useRef(null);
  const recovery = useMemo(() => ({
    read() {
      const value = privacyRecoveryStore.read();
      if (user?.id && value?.subject !== user.id) { privacyRecoveryStore.clear(); return null; }
      return value?.intent || null;
    },
    save(intent) { privacyRecoveryStore.save({ subject: user?.id, intent }); },
    clear: privacyRecoveryStore.clear,
  }), [user?.id]);
  const language = ['tr', 'en'].includes(params.get('lang')) ? params.get('lang') : resolveLanguage(), copy = key => privacyCopy(key, language);
  const intent = { withdraw: 'WITHDRAW_HEALTH', delete: 'DELETE_ACCOUNT' }[params.get('intent')];
  useEffect(() => { heading.current?.focus(); }, []);
  return <div lang={language} className="shinka-viewport shinka-safe-shell text-shinka-ink font-body"><SectionBackdrop section="you"/><main className="max-w-xl mx-auto px-5 py-8 space-y-6">
    <Link className="inline-flex min-h-11 items-center text-shinka-plum" to={`/?lang=${language}`}>← {copy('back')}</Link>
    <h1 ref={heading} tabIndex={-1} className="font-heading text-shinka-h1 focus:outline-none">{copy('title')}</h1>
    {!isAuthenticated && !recovery.read() && <ShinkaCard title={copy('external')}><p>{copy('loginBody')}</p><Link className="flex min-h-11 items-center text-shinka-plum" to={`/login?returnTo=${encodeURIComponent(`/account-privacy?lang=${language}`)}`}>{copy('login')}</Link></ShinkaCard>}
    <ShinkaCard><PrivacyActions language={language} recovery={recovery} authenticated={isAuthenticated} intent={intent} onRemoved={() => isAuthenticated ? logout(false, { preservePrivacyRecovery: true }) : Promise.resolve()}/></ShinkaCard>
  </main></div>;
}
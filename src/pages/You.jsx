import NotificationStatus from '@/features/you/NotificationStatus';
import { Link, useInRouterContext } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import ShinkaCard from '@/components/shinka/ShinkaCard';
import ShinkaSelect from '@/components/shinka/ShinkaSelect';
import ProductNavigation from '@/components/shinka/ProductNavigation';
import { useYou } from '@/features/you/useYou';
import ProfileEditor from '@/features/you/ProfileEditor';
import { youCopy } from '@/foundation/i18n/youCopy';
import { t } from '@/foundation/i18n/strings';
import { onboardingRequest } from '@/services/onboardingService';
import { privacyCopy } from '@/foundation/i18n/privacyCopy';

function YouLink({ to, children, state = undefined, ...props }) {
  return useInRouterContext() ? <Link to={to} state={state} {...props}>{children}</Link> : <a href={to} {...props}>{children}</a>;
}

export default function You({ language = 'en', request = undefined, placeRequest = onboardingRequest, onSaved = undefined, onLoaded = undefined, isAdmin = false, onLogout = () => {}, renderProfileAccess = undefined }) {
  const state = useYou(request, onSaved, onLoaded), { value, controller, busy, error } = state;
  const copy = key => youCopy(key, language), editButton = useRef(null), wasEditing = useRef(false);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { if (wasEditing.current && !state.editing) editButton.current?.focus(); wasEditing.current = state.editing; }, [state.editing]);
  return <div lang={language} data-you-root className="shinka-viewport shinka-safe-shell bg-shinka-ivory text-shinka-ink font-body flex flex-col">
    <header className="flex flex-wrap items-center justify-between px-5 pt-6 gap-2"><YouLink to={`/?lang=${language}`} aria-label={copy('back')} className="inline-flex items-center justify-center min-h-11 min-w-11 text-shinka-plum">← {copy('back')}</YouLink>{renderProfileAccess?.(language)}</header>
    <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8 space-y-6">
      <h1 ref={heading} tabIndex={-1} className="font-heading text-shinka-h1 focus:outline-none" data-you-heading>{copy('title')}</h1>
      {state.loading && <p role="status">{copy('loading')}</p>}
      {value && <>
        <ShinkaCard title={copy('profile')}>
          {state.editing ? <ProfileEditor state={state} language={language} placeRequest={placeRequest}/> : <div className="space-y-4"><dl className="space-y-3">{['display_name','birth_date','birth_time','birthplace_name','sun_sign_code'].map(key => <div key={key}><dt className="text-shinka-caption">{copy(key === 'birthplace_name' ? 'birthplace' : key === 'sun_sign_code' ? 'sun' : key)}</dt><dd className="break-words">{key === 'sun_sign_code' ? copy(value.profile[key]) : value.profile[key] ?? '—'}</dd></div>)}</dl><ShinkaButton variant="secondary" disabled={busy || !!error?.unknown} ref={editButton} onClick={controller.edit}>{copy('edit')}</ShinkaButton></div>}
        </ShinkaCard>
        <ShinkaCard title={copy('preferences')}>
          <form noValidate className="space-y-4" data-you-preferences-form onSubmit={event => { event.preventDefault(); void controller.savePreferences(); }}>
            <div className="space-y-2"><label htmlFor="you-language">{copy('language')}</label><ShinkaSelect id="you-language" disabled={busy || !!error?.unknown} value={state.preferences.language_code} onChange={event => controller.preference('language_code', event.target.value)}><option value="tr">Türkçe</option><option value="en">English</option></ShinkaSelect></div>
            <label className="flex min-h-11 items-center gap-3"><span className="min-w-11 min-h-11 flex items-center justify-center"><input type="checkbox" checked={state.preferences.notifications_enabled} disabled={busy || !!error?.unknown} onChange={event => controller.preference('notifications_enabled', event.target.checked)} className="h-6 w-6 accent-shinka-plum"/></span>{copy('notifications')}</label>
            <p>{copy('notificationTime')}</p><NotificationStatus language={language} enabled={value.preferences.notifications_enabled}/>
            <ShinkaButton type="submit" disabled={busy || !!error?.unknown}>{copy(busy ? 'saving' : 'save')}</ShinkaButton>
          </form>
        </ShinkaCard>
        <ShinkaCard title={copy('account')}><div className="space-y-5">
          <div><p>{copy('privacy')}</p><p className="text-shinka-caption">{copy('legalPending')}</p></div>
          <div><p>{copy('terms')}</p><p className="text-shinka-caption">{copy('legalPending')}</p></div>
          <div><p>{copy('consent')}</p><p data-you-consent>{copy(value.consent.status)}</p></div>
          <YouLink to={`/account-privacy?intent=withdraw&lang=${language}`} className="flex min-h-11 items-center text-shinka-plum">{privacyCopy('withdraw', language)}</YouLink>
          <YouLink to={`/account-privacy?intent=delete&lang=${language}`} className="flex min-h-11 items-center text-shinka-plum">{privacyCopy('delete', language)}</YouLink>
          <ShinkaButton variant="secondary" onClick={onLogout}>{copy('signOut')}</ShinkaButton>
          {isAdmin && <YouLink to="/internal" state={{language}} className="flex min-h-11 items-center text-shinka-plum">{t('admin.panel',language)}</YouLink>}
        </div></ShinkaCard>
      </>}
      {error && <div role="alert" className="space-y-3" data-you-error>
        {!error.field && <p>{copy(error.unknown ? 'unknown' : error.code === 'YOU_EDIT_CONFLICT' ? 'conflict' : value ? 'saveError' : 'loadError')}</p>}
        {error.unknown && state.intent && <><ShinkaButton variant="secondary" disabled={busy} onClick={controller.check}>{copy('check')}</ShinkaButton><ShinkaButton variant="secondary" disabled={busy} onClick={controller.retry}>{copy('retry')}</ShinkaButton></>}
        {(!value || error.code === 'YOU_EDIT_CONFLICT') && <ShinkaButton disabled={busy} onClick={controller.load}>{copy('reopen')}</ShinkaButton>}
      </div>}
      {state.result && <p role="status">{copy(state.result === 'profile' ? 'saved' : 'preferencesSaved')}</p>}
    </main>
    <ProductNavigation current="you" language={language}/>
  </div>;
}

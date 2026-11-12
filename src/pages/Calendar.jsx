import RefreshControl from "@/features/mobile/RefreshControl";
import { mobileCopy } from "@/foundation/i18n/mobileCopy";
import { useEffect, useState } from 'react';
import ProfileMenu from '@/components/profile/ProfileMenu';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import ProductNavigation from '@/components/shinka/ProductNavigation';
import { calendarCopy, calendarErrorKey } from '@/foundation/i18n/calendarCopy';
import { useCalendar } from '@/features/calendar/useCalendar';
import CalendarMonth from '@/features/calendar/CalendarMonth';
import CalendarEditor from '@/features/calendar/CalendarEditor';
import CalendarDeleteDialog from '@/features/calendar/CalendarDeleteDialog';

export default function Calendar({ language: initialLanguage = 'en', renderProfileAccess = undefined, request = undefined, active = true }) {
  const [language, setLanguage] = useState(initialLanguage);
  useEffect(() => { if(initialLanguage) setLanguage(initialLanguage); }, [initialLanguage]);
  const state = useCalendar(request, active), { controller, value } = state;
  const copy = key => calendarCopy(key, language);
  const unresolved = state.outcome === 'unknown';
  const needsConsent = value?.state === 'CONSENT_REQUIRED' && !value.recovery;
  const validationError = /^PERIOD_(DATE_|START_FUTURE|DUPLICATE|CONFLICT)/.test(state.error || '');
  return <div lang={language} data-calendar-root className="shinka-viewport shinka-safe-shell text-shinka-ink font-body flex flex-col">
    <header className="flex flex-wrap items-center justify-end px-5 pt-2 gap-2">
      {renderProfileAccess?.(language) || <ProfileMenu language={language}/>}
    </header>
    <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8 space-y-6">
      <h1 className="font-heading text-shinka-h1">{copy('title')}</h1>
      {value && <RefreshControl showButton={false} language={language} refresh={controller.refresh} loading={state.loading} error={state.refreshError} disabled={state.busy || state.confirmDelete}/>}
      {state.refreshError && !state.error && <ShinkaButton variant="secondary" disabled={state.loading || state.busy} onClick={controller.retry}>{copy('retry')}</ShinkaButton>}
      {state.loading && !value && <p role="status">{copy('loading')}</p>}
      {value && <>
        <CalendarEditor state={state} language={language}/>
        {state.busy && <p role="status" data-calendar-feedback="pending">{copy(state.checking ? 'checking' : 'saving')}</p>}
        <CalendarMonth value={value} selected={state.selected} editing={state.editMode ? state.editing : null} editMode={state.editMode} disabled={state.busy || state.loading || unresolved} language={language} onSelect={controller.chooseDay} onMonth={controller.load}/>
        {!value.writable && !value.pendingReview && <p role="status" data-calendar-blocked>{copy('unavailable')}</p>}
        {value.calculationError && !unresolved && <p role="alert">{copy(value.pendingReview ? 'pendingReview' : value.calculationError === 'CALENDAR_FUTURE_RECORD' ? 'futureRecord' : 'calculation')}</p>}
        {value.pendingReview && !unresolved && <ShinkaButton variant="secondary" disabled={state.busy} onClick={controller.retry}>{mobileCopy('check', language)}</ShinkaButton>}
        {value.calculationNotice && <p role="status" data-calendar-estimate-unavailable>{copy('estimateUnavailable')}</p>}
        {!value.recovery && !needsConsent && !value.hasPeriods && <p role="status">{copy('empty')}</p>}

      </>}
      {state.error && !state.confirmDelete && <div role="alert" data-calendar-error={state.error} className="space-y-3">
        <p>{state.canContinue ? copy('pendingStatus') : unresolved ? mobileCopy('unknown', language) : copy(validationError && state.error === 'PERIOD_CONFLICT' ? 'spacing' : calendarErrorKey(state.error, state.action))}</p>
        <ShinkaButton variant="secondary" disabled={state.busy || (state.loading && !unresolved)} onClick={controller.retry}>{unresolved ? copy('checkStatus') : copy('retry')}</ShinkaButton>
        {state.canContinue && <ShinkaButton variant="secondary" disabled={state.busy} onClick={controller.continueIntent}>{copy('continueChange')}</ShinkaButton>}
      </div>}
      {!value && !state.loading && !state.error && <p role="status">{copy(globalThis.navigator?.onLine === false ? 'offline' : 'loadError')}</p>}
      {state.success && <p role="status">{copy(state.success)}</p>}

    </main>
    {state.confirmDelete && state.editing && <CalendarDeleteDialog date={state.editing.date} busy={state.busy} checking={state.checking} unresolved={unresolved} language={language} error={state.error} onCancel={() => controller.deletePrompt(false)} canContinue={state.canContinue} onContinue={controller.continueIntent} onConfirm={() => state.error ? controller.retry() : controller.submit('delete')}/>}
    <ProductNavigation current="calendar" language={language}/>
  </div>;
}

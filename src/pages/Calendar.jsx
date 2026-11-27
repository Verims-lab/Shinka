import RefreshControl from "@/features/mobile/RefreshControl";
import { useEffect, useState } from 'react';
import ProfileMenu from '@/components/profile/ProfileMenu';
import ProfileLogoSlot from '@/components/profile/ProfileLogoSlot';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import ProductNavigation from '@/components/shinka/ProductNavigation';
import { calendarCopy, calendarErrorKey } from '@/foundation/i18n/calendarCopy';
import { useCalendar } from '@/features/calendar/useCalendar';
import CalendarMonth from '@/features/calendar/CalendarMonth';
import CalendarDayDetails from '@/features/calendar/CalendarDayDetails';
import CalendarRecoveryNotice from '@/features/calendar/CalendarRecoveryNotice';
import CalendarDeleteDialog from '@/features/calendar/CalendarDeleteDialog';

export default function Calendar({ language: initialLanguage = 'en', renderProfileAccess = undefined, request = undefined, active = true }) {
  const [language, setLanguage] = useState(initialLanguage);
  useEffect(() => { if(initialLanguage) setLanguage(initialLanguage); }, [initialLanguage]);
  const state = useCalendar(request, active), { controller, value } = state;
  const copy = key => calendarCopy(key, language);
  const unresolved = state.outcome === 'unknown';
  const recovering = !!state.pendingOperation || unresolved || state.serverPending;
  const deleteDate = state.pendingOperation?.operation === 'delete' ? state.pendingOperation.date : state.editing?.date;
  const validationError = /^PERIOD_(DATE_|START_FUTURE|DUPLICATE|CONFLICT)/.test(state.error || '');
  return <div lang={language} data-calendar-root className="relative shinka-viewport shinka-safe-shell text-shinka-ink font-body flex flex-col">
    <header className="flex flex-wrap items-center justify-end px-5 pt-2 gap-2">
      <ProfileLogoSlot>{renderProfileAccess?.(language) || <ProfileMenu language={language}/>}</ProfileLogoSlot>
    </header>
    <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8 space-y-6">
      <h1 className="font-heading text-shinka-h1">{copy('title')}</h1>
      {value && <RefreshControl showButton={false} language={language} refresh={controller.refresh} loading={state.loading} error={recovering ? null : state.refreshError} disabled={state.busy || state.confirmDelete}/>}
      {state.refreshError && !state.error && !recovering && <ShinkaButton variant="secondary" disabled={state.loading || state.busy} onClick={controller.retry}>{copy('retry')}</ShinkaButton>}
      {state.loading && !value && <p role="status">{copy('loading')}</p>}
      {value && <>
        <CalendarMonth value={value} selected={state.selected} editing={state.moving && !recovering ? state.editing : null} disabled={false} monthDisabled={state.loading} language={language} onSelect={controller.chooseDay} onMonth={controller.load}/>
        <CalendarDayDetails state={state} language={language}/>
        {!value.writable && !recovering && !state.loading && <p role="status" data-calendar-blocked>{copy('unavailable')}</p>}
        {value.calculationError && !recovering && <p role="alert">{copy(value.calculationError === 'CALENDAR_FUTURE_RECORD' ? 'futureRecord' : 'calculation')}</p>}
        {value.calculationNotice && !recovering && <p role="status" data-calendar-estimate-unavailable>{copy('estimateUnavailable')}</p>}
      </>}
      {recovering && <CalendarRecoveryNotice state={state} language={language}/>}
      {state.error && !recovering && !state.confirmDelete && <div role="alert" data-calendar-error={state.error} className="space-y-3">
        <p>{copy(validationError && state.error === 'PERIOD_CONFLICT' ? 'spacing' : calendarErrorKey(state.error, state.action))}</p>
        {!validationError && <ShinkaButton variant="secondary" disabled={state.busy || state.loading} onClick={controller.retry}>{copy('retry')}</ShinkaButton>}
      </div>}
      {!value && !state.loading && !state.error && <p role="status">{copy(globalThis.navigator?.onLine === false ? 'offline' : 'loadError')}</p>}
      {state.success && <p role="status">{copy(state.success)}</p>}

    </main>
    {state.confirmDelete && deleteDate && <CalendarDeleteDialog date={deleteDate} busy={state.busy} checking={state.checking} unresolved={unresolved} language={language} error={state.error} onCancel={() => controller.deletePrompt(false)} canContinue={state.canContinue} onContinue={controller.continueIntent} onConfirm={() => state.error ? controller.retry() : controller.submit('delete')}/>}
    <ProductNavigation current="calendar" language={language}/>
  </div>;
}

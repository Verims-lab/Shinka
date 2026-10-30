import RefreshControl from "@/features/mobile/RefreshControl";
import { mobileCopy } from "@/foundation/i18n/mobileCopy";
import { useEffect, useState } from 'react';
import ProfileMenu from '@/components/profile/ProfileMenu';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import ShinkaCard from '@/components/shinka/ShinkaCard';
import ShinkaInput from '@/components/shinka/ShinkaInput';
import ProductNavigation from '@/components/shinka/ProductNavigation';
import { calendarCopy, calendarErrorKey } from '@/foundation/i18n/calendarCopy';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
import { useCalendar } from '@/features/calendar/useCalendar';
import CalendarMonth, { formatCalendarDate } from '@/features/calendar/CalendarMonth';
import CalendarDeleteDialog from '@/features/calendar/CalendarDeleteDialog';

export default function Calendar({ language: initialLanguage = 'en', renderProfileAccess = undefined, request = undefined, active = true }) {
  const [language, setLanguage] = useState(initialLanguage);
  useEffect(() => { if(initialLanguage) setLanguage(initialLanguage); }, [initialLanguage]);
  const state = useCalendar(request, active), { controller, value } = state;
  const copy = key => calendarCopy(key, language);
  const unresolved = state.outcome === 'unknown';
  const needsConsent = value?.state === 'CONSENT_REQUIRED' && !value.recovery;
  const realSelected = value?.starts.find(row => row.id === state.editing?.id && row.date === state.selected);
  const futureSelected = Boolean(value && state.selected > value.today);
  const draftSelected = state.selected && state.outcome === null && value?.writable && !futureSelected &&
    (!value.starts.some(row => row.date === state.selected) || state.editing && state.editing.date !== state.selected);
  const dateError = futureSelected ? 'PERIOD_START_FUTURE' : state.error;
  const validationError = /^PERIOD_(DATE_|START_FUTURE|DUPLICATE|CONFLICT)/.test(dateError || '');
  return <div lang={language} data-calendar-root className="shinka-viewport shinka-safe-shell text-shinka-ink font-body flex flex-col">
    <header className="flex flex-wrap items-center justify-between px-5 pt-6 gap-2">
      <span className="font-heading font-medium text-shinka-h3 text-shinka-plum">Shinka</span>
      {renderProfileAccess?.(language) || <ProfileMenu language={language}/>}
    </header>
    <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8 space-y-6">
      <h1 className="font-heading text-shinka-h1">{copy('title')}</h1>
      {value && <RefreshControl language={language} refresh={controller.refresh} loading={state.loading} error={state.refreshError} disabled={state.busy || state.confirmDelete}/>}
      {state.loading && !value && <p role="status">{copy('loading')}</p>}
      {value && <>
        <CalendarMonth value={value} selected={state.selected} disabled={state.busy || unresolved} language={language} onSelect={controller.select} onMonth={controller.load}/>
        {!value.writable && !value.pendingReview && <p role="status" data-calendar-blocked>{copy('unavailable')}</p>}
        {value.calculationError && !unresolved && <p role="alert">{copy(value.pendingReview ? 'pendingReview' : value.calculationError === 'CALENDAR_FUTURE_RECORD' ? 'futureRecord' : 'calculation')}</p>}
        {value.pendingReview && !unresolved && <ShinkaButton variant="secondary" disabled={state.busy} onClick={controller.retry}>{mobileCopy('check', language)}</ShinkaButton>}
        {value.calculationNotice && <p role="status" data-calendar-estimate-unavailable>{copy('estimateUnavailable')}</p>}
        {!value.recovery && !needsConsent && !value.hasPeriods && <p role="status">{copy('empty')}</p>}
        <ShinkaCard>
          {state.busy ? <p role="status" className="mb-4" data-calendar-feedback="pending">{copy('saving')}</p> : draftSelected && !state.error && <p role="status" className="mb-4" data-calendar-feedback="draft">{copy('draft')}</p>}
          <form noValidate aria-busy={state.busy} className="space-y-4" onSubmit={event => { event.preventDefault(); controller.submit(state.editing ? 'edit' : 'add'); }}>
            {state.editing && <div><p>{copy('editing')}: {formatCalendarDate(state.editing.date, language)}</p><ShinkaButton variant="ghost" disabled={state.busy || unresolved} onClick={controller.cancelEdit}>{copy('stopEditing')}</ShinkaButton></div>}
            <div><label htmlFor="calendar-start-date" className="block mb-2">{copy('date')}</label><ShinkaInput id="calendar-start-date" type="date" max={value.today} value={state.selected} disabled={state.busy || unresolved} aria-invalid={validationError} aria-describedby={validationError ? 'calendar-date-error' : undefined} onChange={event => controller.select(event.target.value)}/>
              {validationError && <p id="calendar-date-error" role="alert" className="mt-2">{copy(calendarErrorKey(dateError, state.action))}</p>}
            </div>
            {needsConsent && <><p>{copy('consent')}</p><label className="flex gap-3 items-start min-h-11 cursor-pointer">
              <span className="min-h-11 min-w-11 flex items-center justify-center"><input type="checkbox" checked={state.consent} disabled={state.busy || unresolved} onChange={event => controller.consent(event.target.checked)} className="h-6 w-6 accent-shinka-plum"/></span>
              <span className="text-shinka-body">{onboardingCopy('health_consent', language)}</span>
            </label></>}
            <ShinkaButton type="submit" className="w-full" disabled={state.busy || unresolved || futureSelected || !value.writable || (needsConsent && !state.consent)}>{copy(state.busy ? 'saving' : 'mark')}</ShinkaButton>
            {realSelected && <ShinkaButton variant="ghost" className="w-full" disabled={state.busy || unresolved || !value.writable} onClick={event => { event.currentTarget.focus(); controller.deletePrompt(true); }}>{copy('delete')}</ShinkaButton>}
          </form>
        </ShinkaCard>
      </>}
      {state.error && !validationError && <div role="alert" data-calendar-error={state.error} className="space-y-3">
        <p>{unresolved ? mobileCopy('unknown', language) : copy(calendarErrorKey(state.error, state.action))}</p>
        <ShinkaButton variant="secondary" disabled={state.busy || (state.loading && !unresolved)} onClick={controller.retry}>{unresolved ? mobileCopy('check', language) : copy('retry')}</ShinkaButton>
      </div>}
      {!value && !state.loading && !state.error && <p role="status">{copy(globalThis.navigator?.onLine === false ? 'offline' : 'loadError')}</p>}
      {state.success && <p role="status">{copy(state.success)}</p>}

    </main>
    {state.confirmDelete && realSelected && <CalendarDeleteDialog date={realSelected.date} busy={state.busy} language={language} error={state.error} onCancel={() => controller.deletePrompt(false)} onConfirm={() => state.error ? controller.retry() : controller.submit('delete')}/>}
    <ProductNavigation current="calendar" language={language}/>
  </div>;
}

import { useState } from 'react';
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

export default function Calendar({ language: initialLanguage = 'en', renderProfileAccess = undefined, request = undefined }) {
  const [language, setLanguage] = useState(initialLanguage);
  const state = useCalendar(request), { controller, value } = state;
  const copy = key => calendarCopy(key, language);
  const needsConsent = value?.state === 'CONSENT_REQUIRED';
  const realSelected = value?.starts.find(row => row.id === state.editing?.id && row.date === state.selected);
  const validationError = /^PERIOD_(DATE_|START_FUTURE|DUPLICATE|CONFLICT)/.test(state.error || '');
  return <div lang={language} data-calendar-root className="shinka-viewport shinka-safe-shell bg-shinka-ivory text-shinka-ink font-body flex flex-col">
    <header className="flex flex-wrap items-center justify-between px-5 pt-6 gap-2">
      <span className="font-heading font-medium text-shinka-h3 text-shinka-plum">Shinka</span>
      <div className="flex flex-wrap items-center gap-1">{['tr', 'en'].map(lang => <ShinkaButton key={lang} variant="ghost" aria-pressed={lang === language} onClick={() => setLanguage(lang)}>{lang.toUpperCase()}</ShinkaButton>)}
        {renderProfileAccess?.(language) || <ProfileMenu language={language}/>}</div>
    </header>
    <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8 space-y-6">
      <h1 className="font-heading text-shinka-h1">{copy('title')}</h1>
      {state.loading && <p role="status">{copy('loading')}</p>}
      {value && <>
        <CalendarMonth value={value} selected={state.selected} disabled={state.busy} language={language} onSelect={controller.select} onMonth={controller.load}/>
        {!value.writable && <p role="status" data-calendar-blocked>{copy('unavailable')}</p>}
        {value.calculationError && <p role="alert">{copy(value.pendingReview ? 'pendingReview' : 'calculation')}</p>}
        {value.recovery && <div role="alert"><p>{copy('resumePending')}</p><ShinkaButton disabled={state.busy} onClick={() => controller.submit('resume')}>{copy('retry')}</ShinkaButton></div>}
        {value.pendingReview && !value.recovery && <ShinkaButton variant="secondary" disabled={state.busy} onClick={() => controller.submit('acknowledge')}>{copy('keepDates')}</ShinkaButton>}
        {value.calculationNotice && <p role="status" data-calendar-estimate-unavailable>{copy('estimateUnavailable')}</p>}
        {!value.recovery && !needsConsent && !value.hasPeriods && <p role="status">{copy('empty')}</p>}
        <ShinkaCard>
          <form noValidate className="space-y-4" onSubmit={event => { event.preventDefault(); controller.submit(state.editing ? 'edit' : 'add'); }}>
            {state.editing && <div><p>{copy('editing')}: {formatCalendarDate(state.editing.date, language)}</p><ShinkaButton variant="ghost" disabled={state.busy} onClick={controller.cancelEdit}>{copy('stopEditing')}</ShinkaButton></div>}
            <div><label htmlFor="calendar-start-date" className="block mb-2">{copy('date')}</label><ShinkaInput id="calendar-start-date" type="date" max={value.today} value={state.selected} disabled={state.busy} aria-invalid={validationError} aria-describedby={validationError ? 'calendar-date-error' : undefined} onChange={event => controller.select(event.target.value)}/>
              {validationError && <p id="calendar-date-error" role="alert" className="mt-2">{copy(calendarErrorKey(state.error, state.action))}</p>}
            </div>
            {needsConsent && <><p>{copy('consent')}</p><label className="flex gap-3 items-start min-h-11 cursor-pointer">
              <span className="min-h-11 min-w-11 flex items-center justify-center"><input type="checkbox" checked={state.consent} disabled={state.busy} onChange={event => controller.consent(event.target.checked)} className="h-6 w-6 accent-shinka-plum"/></span>
              <span className="text-shinka-body">{onboardingCopy('health_consent', language)}</span>
            </label></>}
            <ShinkaButton type="submit" className="w-full" disabled={state.busy || !value.writable || (needsConsent && !state.consent)}>{copy(state.busy ? 'saving' : 'mark')}</ShinkaButton>
            {realSelected && <ShinkaButton variant="ghost" className="w-full" disabled={state.busy || !value.writable} onClick={event => { event.currentTarget.focus(); controller.deletePrompt(true); }}>{copy('delete')}</ShinkaButton>}
          </form>
        </ShinkaCard>
      </>}
      {state.error && !validationError && <div role="alert" data-calendar-error={state.error} className="space-y-3">
        <p>{copy(calendarErrorKey(state.error, state.action))}</p>
        <ShinkaButton variant="secondary" disabled={state.busy || state.loading} onClick={controller.retry}>{copy('retry')}</ShinkaButton>
      </div>}
      {!value && !state.loading && !state.error && <p role="status">{copy(globalThis.navigator?.onLine === false ? 'offline' : 'loadError')}</p>}
      {state.success && <p role="status">{copy(state.success)}</p>}
      <ShinkaButton variant="ghost" disabled={state.loading || state.busy} onClick={() => controller.load()}>{copy('reload')}</ShinkaButton>
    </main>
    {state.confirmDelete && realSelected && <CalendarDeleteDialog date={realSelected.date} busy={state.busy} language={language} error={state.error} onCancel={() => controller.deletePrompt(false)} onConfirm={() => state.error ? controller.retry() : controller.submit('delete')}/>}
    <ProductNavigation current="calendar" language={language}/>
  </div>;
}

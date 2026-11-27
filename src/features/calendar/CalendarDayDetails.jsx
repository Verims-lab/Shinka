import ShinkaButton from '@/components/shinka/ShinkaButton';
import { calendarCopy } from '@/foundation/i18n/calendarCopy';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
import { formatCalendarDate } from './CalendarMonth';
import { calendarSelection } from './calendarSelection';

export default function CalendarDayDetails({ state, language }) {
  const { controller, value } = state, copy = key => calendarCopy(key, language);
  const day = calendarSelection(state), unknown = !!state.pendingOperation || state.outcome === 'unknown' || state.serverPending;
  const locked = state.busy || state.loading || unknown || !value.writable;
  const needsConsent = value.state === 'CONSENT_REQUIRED' && !value.recovery;
  if (!day) return <p role="status" className="text-shinka-body" data-calendar-selection-hint>{copy('selectPrompt')}</p>;
  const status = day.start ? 'recordedStart' : value.state === 'RECOVERY_REQUIRED' ? 'unverifiedDay' : !unknown && state.moving && day.action ? 'notSaved' : day.recorded ? 'recordedInterval' : day.predicted ? 'predictedInterval' : day.future ? 'futureInfo' : needsConsent ? 'consent' : null;
  const invalid = !!day.error || /^PERIOD_/.test(state.error || '');
  const canAdd = day.action === 'add' && !day.future;
  const save = event => {
    if (locked || invalid || !day.action || needsConsent && !state.consent) return;
    event.currentTarget.focus();
    controller.submit(day.action);
  };
  const focusDay = (root, date) => requestAnimationFrame(() => {
    if (root?.isConnected && !root.closest('[hidden],[inert]')) (root.querySelector(`[data-calendar-date="${date}"]`) || root.querySelector('[data-calendar-date]'))?.focus();
  });
  return <section data-calendar-selection data-selected-date={day.date} className="space-y-3 border-t border-shinka-line pt-4" aria-labelledby="calendar-selected-date">
    <h3 id="calendar-selected-date" className="font-heading font-medium text-shinka-h4"><time dateTime={day.date}>{formatCalendarDate(day.date, language)}</time>{day.today && <span className="ml-2 font-body text-shinka-caption">{copy('today')}</span>}</h3>
    <p id="calendar-selected-status" role="status" data-calendar-day-status hidden={!status} className="text-shinka-body">{status && copy(status)}</p>
    {day.predicted && !state.moving && <p className="text-shinka-caption">{copy(day.future ? 'predictedFuture' : 'predictionNote')}</p>}
    {!unknown && state.moving && state.editing && <p id="calendar-move-hint" className="text-shinka-body">{copy('moveFrom')}: {formatCalendarDate(state.editing.date, language)}. {copy('moveHint')}</p>}
    {!unknown && state.moving && day.action && (day.recorded || day.predicted) && <p className="text-shinka-caption">{copy(day.recorded ? 'recordedInterval' : 'predictionNote')}</p>}
    {!unknown && day.error && !state.error && (state.moving || !day.future) && <p id="calendar-draft-error" role={state.moving ? 'alert' : 'status'} className="text-shinka-body">{copy(day.error === 'PERIOD_CONFLICT' ? 'spacing' : day.error === 'PERIOD_DUPLICATE' ? 'duplicate' : 'future')}</p>}
    {!unknown && needsConsent && canAdd && <label className="flex gap-3 items-start min-h-11 cursor-pointer">
      <span className="min-h-11 min-w-11 flex items-center justify-center"><input type="checkbox" checked={state.consent} disabled={locked} onChange={event => controller.consent(event.target.checked)} className="h-6 w-6 accent-shinka-plum"/></span>
      <span className="text-shinka-body">{onboardingCopy('health_consent', language)}</span>
    </label>}
    {!unknown && (state.moving || day.start || canAdd) && <div className="flex flex-wrap gap-2" role="group" aria-label={copy('dateActions')} aria-busy={state.busy}>
      {state.moving ? <>
        <ShinkaButton data-calendar-save disabled={locked || !day.action || invalid} onClick={save}>{copy('saveMove')}</ShinkaButton>
        <ShinkaButton data-calendar-cancel variant="secondary" disabled={state.busy || state.loading} onClick={event => { const root=event.currentTarget.closest('[data-calendar-root]');controller.cancelMove();focusDay(root, state.editing?.date); }}>{copy('cancelDraft')}</ShinkaButton>
      </> : day.start ? <>
        <ShinkaButton data-calendar-move variant="secondary" disabled={locked} onClick={event => { const root=event.currentTarget.closest('[data-calendar-root]');controller.beginMove();focusDay(root, day.date); }}>{copy('changeDate')}</ShinkaButton>
        <ShinkaButton data-calendar-delete variant="ghost" disabled={locked} onClick={event => {event.currentTarget.focus();controller.deletePrompt(true);}}>{copy('deleteRecord')}</ShinkaButton>
      </> : canAdd && <ShinkaButton data-calendar-save data-calendar-add disabled={locked || invalid || needsConsent && !state.consent} onClick={save}>{copy('markStart')}</ShinkaButton>}
    </div>}

  </section>;
}

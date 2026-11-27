import ShinkaButton from '@/components/shinka/ShinkaButton';
import { calendarCopy } from '@/foundation/i18n/calendarCopy';
import { formatCalendarDate } from './CalendarMonth';

export default function CalendarRecoveryNotice({ state, language }) {
  if (state.confirmDelete) return null;
  const copy = key => calendarCopy(key, language), operation = state.pendingOperation;
  const key = state.checking ? 'recoveryChecking' : state.outcome === 'pending' ? 'saving'
    : state.refreshError || state.error && !['CALENDAR_PENDING_REVIEW','CALENDAR_STATE_CHANGED'].includes(state.error) ? 'recoveryCheckFailed'
    : ['PENDING','CONFLICT'].includes(operation?.status) ? 'recoveryStillPending' : 'recoveryNotice';
  return <section data-calendar-recovery data-calendar-error={state.error || undefined} className="space-y-3" aria-label={copy('recoveryTitle')}>
    <p role="status" data-calendar-feedback={state.busy ? 'pending' : undefined} className="text-shinka-body">
      {operation?.date && <><time dateTime={operation.date}>{formatCalendarDate(operation.date, language)}</time>{': '}</>}{copy(key)}
    </p>
    {state.outcome !== 'pending' && <div className="flex flex-wrap gap-2">
      <ShinkaButton data-calendar-check variant="secondary" disabled={state.busy} onClick={state.controller.retry}>{copy('checkStatus')}</ShinkaButton>
      {operation && state.canContinue && <ShinkaButton data-calendar-continue variant="secondary" disabled={state.busy} onClick={state.controller.continueIntent}>{copy('continueChange')}</ShinkaButton>}
    </div>}
  </section>;
}

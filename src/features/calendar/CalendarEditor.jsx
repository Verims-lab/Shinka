import ShinkaButton from '@/components/shinka/ShinkaButton';
import { calendarCopy } from '@/foundation/i18n/calendarCopy';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
import { formatCalendarDate } from './CalendarMonth';
import { calendarDraft } from './calendarDraft';

export default function CalendarEditor({ state, language }) {
  const { controller, value } = state, copy = key => calendarCopy(key, language);
  const draft = calendarDraft(state), locked = state.busy || state.loading || state.outcome === 'unknown';
  const needsConsent = value.state === 'CONSENT_REQUIRED' && !value.recovery;
  const save = event => {
    if (!draft.action || draft.error || locked || !value.writable || needsConsent && !state.consent) return;
    event.currentTarget.focus();
    if (draft.action === 'delete') controller.deletePrompt(true);
    else controller.submit(draft.action);
  };
  if (!state.editMode) return <ShinkaButton data-calendar-edit variant="secondary" disabled={locked || !value.writable} onClick={controller.beginEdit}>{copy('editDates')}</ShinkaButton>;
  return <div data-calendar-editor className="space-y-3">
    <div className="flex flex-wrap gap-2" role="group" aria-label={copy('editDates')} aria-busy={state.busy}>
      <ShinkaButton data-calendar-save disabled={locked || !draft.action || !!draft.error || !value.writable || needsConsent && !state.consent} onClick={save}>{copy('save')}</ShinkaButton>
      <ShinkaButton data-calendar-cancel variant="secondary" disabled={state.busy || state.outcome === 'unknown'} onClick={controller.cancelEdit}>{copy('cancelDraft')}</ShinkaButton>
    </div>
    <p id="calendar-edit-hint" className="text-shinka-caption">{copy('editHint')}</p>
    {state.outcome !== 'unknown' && !state.busy && draft.action && <p role="status" data-calendar-feedback="draft" data-draft-date={state.selected}>
      {copy(`${draft.action}Draft`)}: {state.editing && formatCalendarDate(state.editing.date, language)}{draft.action === 'edit' ? ' → ' : ''}{draft.action !== 'delete' && formatCalendarDate(state.selected, language)}. {copy('draft')}
    </p>}
    {draft.error && <p id="calendar-draft-error" role="alert">{copy(draft.error === 'PERIOD_CONFLICT' ? 'spacing' : 'future')}</p>}
    {needsConsent && <label className="flex gap-3 items-start min-h-11 cursor-pointer">
      <span className="min-h-11 min-w-11 flex items-center justify-center"><input type="checkbox" checked={state.consent} disabled={locked} onChange={event => controller.consent(event.target.checked)} className="h-6 w-6 accent-shinka-plum"/></span>
      <span className="text-shinka-body">{onboardingCopy('health_consent', language)}</span>
    </label>}
    <p className="text-shinka-caption">{copy('draftPolicy')}</p>
  </div>;
}

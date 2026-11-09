import { useModalSurface } from "@/features/mobile/useModalSurface";
import { useRef } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { calendarCopy, calendarErrorKey } from '@/foundation/i18n/calendarCopy';
import { formatCalendarDate } from './CalendarMonth';
export default function CalendarDeleteDialog({ date, busy, checking = false, unresolved = false, language, canContinue = false, onContinue = undefined, onCancel, onConfirm, error }) {
  const dialog = useRef(null), copy = key => calendarCopy(key, language);
  const { dismiss, ...modal } = useModalSurface(dialog, onCancel);
  return <dialog ref={dialog} tabIndex={-1} {...modal} aria-labelledby="calendar-delete-title" aria-describedby="calendar-delete-description"
    className="shinka-calendar-dialog rounded-shinka-lg border border-shinka-line bg-shinka-white p-5 text-shinka-ink">
    <h2 id="calendar-delete-title" className="font-heading text-shinka-h3">{copy(unresolved ? 'deleteStatusTitle' : 'deleteTitle')}</h2>
    <p className="my-4 font-medium">{formatCalendarDate(date, language)}</p>
    <p id="calendar-delete-description" role={unresolved ? 'alert' : undefined} data-calendar-error={unresolved ? error : undefined} className="text-shinka-body">{copy(unresolved ? 'deleteUnknown' : 'deleteBody')}</p>
    {error && !unresolved && <p role="alert" data-calendar-error={error} className="mt-4">{copy(calendarErrorKey(error, 'delete'))}</p>}
    <div className="mt-6 flex flex-col gap-2">
      <ShinkaButton autoFocus variant="secondary" disabled={busy} onClick={dismiss}>{copy('cancel')}</ShinkaButton>
      <ShinkaButton disabled={busy} onClick={onConfirm}>{copy(busy ? checking ? 'checking' : 'saving' : unresolved ? 'checkStatus' : error ? 'retry' : 'delete')}</ShinkaButton>
      {unresolved && canContinue && <ShinkaButton variant="secondary" disabled={busy} onClick={onContinue}>{copy('continueChange')}</ShinkaButton>}
    </div>
  </dialog>;
}

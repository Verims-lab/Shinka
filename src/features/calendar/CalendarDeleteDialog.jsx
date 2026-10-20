import { useEffect, useRef } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { calendarCopy, calendarErrorKey } from '@/foundation/i18n/calendarCopy';
import { formatCalendarDate } from './CalendarMonth';
export default function CalendarDeleteDialog({ date, busy, language, onCancel, onConfirm, error }) {
  const dialog = useRef(null), copy = key => calendarCopy(key, language);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} aria-labelledby="calendar-delete-title" aria-describedby="calendar-delete-description"
    onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}
    className="shinka-calendar-dialog rounded-shinka-lg border border-shinka-line bg-shinka-white p-5 text-shinka-ink">
    <h2 id="calendar-delete-title" className="font-heading text-shinka-h3">{copy('deleteTitle')}</h2>
    <p className="my-4 font-medium">{formatCalendarDate(date, language)}</p>
    <p id="calendar-delete-description" className="text-shinka-body">{copy('deleteBody')}</p>
    {error && <p role="alert" className="mt-4">{copy(calendarErrorKey(error, 'delete'))}</p>}
    <div className="mt-6 flex flex-col gap-2">
      <ShinkaButton autoFocus variant="secondary" disabled={busy} onClick={onCancel}>{copy('cancel')}</ShinkaButton>
      <ShinkaButton disabled={busy} onClick={onConfirm}>{copy(busy ? 'saving' : 'delete')}</ShinkaButton>
    </div>
  </dialog>;
}

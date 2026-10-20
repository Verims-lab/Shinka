import { useEffect, useRef } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { calendarCopy, calendarErrorKey } from '@/foundation/i18n/calendarCopy';
import { formatCalendarDate } from './CalendarMonth';
export default function CalendarDeleteDialog({ date, busy, language, onCancel, onConfirm, error }) {
  const dialog = useRef(null), copy = key => calendarCopy(key, language);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    dialog.current.querySelector('button:not(:disabled)')?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  const keys = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!busy) onCancel();
    } else if (event.key === 'Tab') {
      // Safari's button tab preference must not move focus out of a modal.
      event.preventDefault();
      const controls = [...dialog.current.querySelectorAll('button:not(:disabled)')];
      const index = controls.indexOf(document.activeElement);
      const next = (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
      (controls[next] || dialog.current).focus();
    }
  };
  return <dialog ref={dialog} tabIndex={-1} onKeyDown={keys} aria-labelledby="calendar-delete-title" aria-describedby="calendar-delete-description"
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

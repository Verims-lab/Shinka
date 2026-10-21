import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { calendarCopy } from '@/foundation/i18n/calendarCopy';

export function moveMonth(month, delta) {
  const [year, number] = month.split('-').map(Number);
  const value = new Date(Date.UTC(year, number - 1 + delta, 1));
  if (year < 100) value.setUTCFullYear(year + Math.floor((number - 1 + delta) / 12));
  return value.toISOString().slice(0, 7);
}
/** @param {string} date @param {string} language @param {Intl.DateTimeFormatOptions} options */
export function formatCalendarDate(date, language, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-GB', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
export default function CalendarMonth({ value, selected, onSelect, onMonth, disabled, language }) {
  const root = useRef(null), copy = key => calendarCopy(key, language);
  const first = new Date(`${value.month}-01T12:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const last = new Date(`${moveMonth(value.month, 1)}-01T12:00:00Z`);
  last.setUTCDate(0);
  const cells = Array.from({ length: Math.ceil((offset + last.getUTCDate()) / 7) * 7 }, (_, i) => {
    const n = i - offset + 1;
    return n < 1 || n > last.getUTCDate() ? null : `${value.month}-${String(n).padStart(2, '0')}`;
  });
  const recorded = new Set(value.recordedDays), predicted = new Set(value.predictedDays), starts = new Set(value.starts.map(row => row.date));
  const keyboard = event => {
    const buttons = [...root.current.querySelectorAll('button[data-calendar-date]')];
    const current = buttons.indexOf(event.target);
    const deltas = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7, Home: -((current + offset) % 7), End: 6 - (current + offset) % 7 };
    if (deltas[event.key] == null) return;
    event.preventDefault();
    buttons[Math.max(0, Math.min(buttons.length - 1, current + deltas[event.key]))]?.focus();
  };
  return <section aria-label={copy('title')} className="space-y-4">
    <div className="flex items-center justify-between gap-1">
      <ShinkaButton variant="ghost" aria-label={copy('previous')} onClick={() => onMonth(moveMonth(value.month, -1))} disabled={disabled || value.month <= '0001-02'}><ChevronLeft aria-hidden="true"/></ShinkaButton>
      <h2 className="font-heading text-shinka-h3 text-center" aria-live="polite">{formatCalendarDate(`${value.month}-01`, language, { month: 'long', year: 'numeric' })}</h2>
      <ShinkaButton variant="ghost" aria-label={copy('next')} onClick={() => onMonth(moveMonth(value.month, 1))} disabled={disabled || value.month >= '9999-11'}><ChevronRight aria-hidden="true"/></ShinkaButton>
    </div>
    <div className="shinka-calendar-grid" ref={root} role="grid" aria-label={copy('title')} onKeyDown={keyboard}>
      <div role="row" className="grid grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => <span key={i} role="columnheader" className="min-w-0 break-words text-center text-shinka-caption py-2">{formatCalendarDate(`2026-10-${19 + i}`, language, { weekday: 'short' })}</span>)}
      </div>
      {Array.from({ length: cells.length / 7 }, (_, week) => <div role="row" key={week} className="grid grid-cols-7">
        {cells.slice(week * 7, week * 7 + 7).map((day, index) => <div role="gridcell" key={day || `empty-${index}`} aria-selected={!!day && selected === day} className="flex justify-center">
          {day && <button type="button" data-calendar-date={day} data-period={recorded.has(day)} data-predicted={predicted.has(day)} disabled={disabled}
            aria-label={[formatCalendarDate(day, language), starts.has(day) ? copy('start') : recorded.has(day) ? copy('period') : predicted.has(day) ? copy('predicted') : '', selected === day ? copy('selected') : ''].filter(Boolean).join(', ')}
            aria-current={day === value.today ? 'date' : undefined}
            onClick={() => onSelect(day)}
            className={`shinka-calendar-day text-shinka-body rounded-full text-shinka-ink focus-visible:outline-2 focus-visible:outline-shinka-plum ${recorded.has(day) ? 'bg-shinka-blush' : predicted.has(day) ? 'bg-shinka-lavender' : ''} ${selected === day ? 'ring-2 ring-inset ring-shinka-plum' : ''}`}>
            {Number(day.slice(-2))}{starts.has(day) && <span aria-hidden="true" className="block h-1 w-1 rounded-full bg-shinka-plum mx-auto"/>}
          </button>}
        </div>)}
      </div>)}
    </div>
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-shinka-caption" aria-label={copy('title')}>
      {['period', 'predicted', 'selected'].map(key => <li key={key} className="flex items-center gap-2"><span aria-hidden="true" className={`h-4 w-4 rounded-full ${key === 'period' ? 'bg-shinka-blush' : key === 'predicted' ? 'bg-shinka-lavender' : 'ring-2 ring-inset ring-shinka-plum'}`}/>{copy(key)}</li>)}
    </ul>
  </section>;
}

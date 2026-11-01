import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import FieldError from '@/features/onboarding/FieldError';
import { useModalSurface } from '@/features/mobile/useModalSurface';
import { optionalBirthTime } from '../../../base44/shared/onboardingValidation.js';

// The form owns the sole committed HH:mm string. The modal's uncontrolled inputs
// are a disposable selection draft: opening/cancelling never modifies that string.
function TimeSelection({ value, onChange, onClose, t }) {
  const dialog = useRef(null), [invalid, setInvalid] = useState(false);
  const { dismiss, ...modal } = useModalSurface(dialog, onClose);
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const [hour, minute] = valid ? value.split(':') : ['', ''];
  const apply = event => {
    event.preventDefault(); event.stopPropagation();
    const data = new FormData(event.currentTarget), selected = `${data.get('hour')}:${data.get('minute')}`;
    try { optionalBirthTime(selected); } catch { setInvalid(true); return; }
    onChange(selected); dismiss();
  };
  return <dialog ref={dialog} {...modal} tabIndex={-1} aria-labelledby="birth-time-title" className="shinka-calendar-dialog rounded-shinka-lg border border-shinka-line bg-shinka-white p-5 text-shinka-ink" data-time-dialog>
    <form onSubmit={apply} noValidate className="min-w-0 space-y-4">
      <h2 id="birth-time-title" className="font-heading text-shinka-h3">{t('timeChoose')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {[['hour', hour, 24, 'timeHour'], ['minute', minute, 60, 'timeMinute']].map(([name, initial, count, label]) => <label key={name} className="min-w-0">
          {t(label)}
          <select name={name} defaultValue={initial} aria-invalid={invalid} aria-describedby={invalid ? 'time-selection-error' : undefined} onChange={() => setInvalid(false)} className="mt-2 min-h-11 w-full rounded-shinka-sm border border-shinka-line bg-shinka-white p-2">
            <option value="">--</option>
            {Array.from({length: Number(count)}, (_, i) => String(i).padStart(2, '0')).map(part => <option key={part} value={part}>{part}</option>)}
          </select>
        </label>)}
      </div>
      {invalid && <p id="time-selection-error" role="alert">{t('TIME_INVALID')}</p>}
      <div className="flex flex-col gap-3">
        <ShinkaButton type="submit" data-time-set>{t('timeSet')}</ShinkaButton>
        <ShinkaButton variant="secondary" onClick={dismiss} data-time-cancel>{t('timeCancel')}</ShinkaButton>
        <ShinkaButton variant="ghost" onClick={() => { onChange(''); dismiss(); }} data-time-clear>{t('timeClear')}</ShinkaButton>
      </div>
    </form>
  </dialog>;
}
export default function BirthTimeField({ value, onChange, disabled, error, t }) {
  const [open, setOpen] = useState(false), field = useRef(null);
  return <div ref={field} className="min-w-0 space-y-2">
    <div className="shinka-framed-field">
      <label htmlFor="birth_time" className="block text-shinka-small text-shinka-plum">{t('birth_time')} <span className="text-shinka-taupe">{t('placeOptional')}</span></label>
      <div className="flex min-w-0 items-center gap-2">
        <input id="birth_time" type="text" inputMode="text" autoComplete="off" placeholder="HH:mm" value={value} onChange={event => onChange(event.target.value)} disabled={disabled} aria-invalid={error?.field === 'birth_time'} aria-describedby={error?.field === 'birth_time' ? 'birth_time-error' : undefined} className="shinka-framed-input min-h-11 w-full min-w-0 bg-transparent text-[17px] text-shinka-ink" />
        <button type="button" disabled={disabled} aria-label={t('timeChoose')} aria-haspopup="dialog" onClick={event => { event.currentTarget.focus(); setOpen(true); }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-shinka-taupe" data-time-open><Clock aria-hidden="true" className="h-5 w-5" /></button>
      </div>
    </div>
    <FieldError name="birth_time" error={error} t={t} />
    {open && createPortal(<TimeSelection value={value} t={t} onChange={onChange} onClose={() => setOpen(false)} />, field.current.ownerDocument.body)}
  </div>;
}

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { useModalSurface } from '@/features/mobile/useModalSurface';

// Bottom-sheet choice list. Reuses the shared modal focus/Escape/back-history
// surface. Picking an option only changes the caller's draft; cancel changes nothing.
export default function PreferenceSheet({ id, title, options, value, cancelLabel, onPick, onClose }) {
  const dialog = useRef(null);
  const { dismiss, ...modal } = useModalSurface(dialog, onClose);
  const pick = next => { if (next !== value) onPick(next); dismiss(); };
  return createPortal(<dialog ref={dialog} {...modal} tabIndex={-1} aria-labelledby={`${id}-sheet-title`} className="shinka-place-sheet border border-shinka-line" data-pref-sheet={id}>
    <h2 id={`${id}-sheet-title`} className="font-heading text-shinka-h3 mb-3">{title}</h2>
    <div role="radiogroup" aria-labelledby={`${id}-sheet-title`} className="flex flex-col gap-1">
      {options.map(option => <button key={option.value} type="button" role="radio" aria-checked={option.value === value} data-option={option.value} onClick={() => pick(option.value)}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-shinka-md px-4 py-2 text-left break-words focus-visible:outline-2 focus-visible:outline-shinka-plum aria-checked:bg-shinka-ivory">
        <span>{option.label}</span>{option.value === value && <Check className="h-5 w-5 shrink-0 text-shinka-plum" aria-hidden="true"/>}
      </button>)}
    </div>
    <ShinkaButton variant="secondary" className="mt-4 w-full" onClick={dismiss}>{cancelLabel}</ShinkaButton>
  </dialog>, document.body);
}
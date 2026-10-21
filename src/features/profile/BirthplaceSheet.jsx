import { useRef, useState } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { useModalSurface } from '@/features/mobile/useModalSurface';
import { mobileCopy } from '@/foundation/i18n/mobileCopy';

export default function BirthplaceSheet({ label, options, selected, text, choose, close, language, children, disabled }) {
  const [focused, setFocused] = useState(selected?.id);
  const focusId = options.some(option => option.id === focused) ? focused : options[0]?.id;
  const dialog = useRef(null), modal = useModalSurface(dialog, close);
  const keys = event => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && event.target.getAttribute('role') === 'radio') {
      event.preventDefault();
      const rows = [...dialog.current.querySelectorAll('[role="radio"]:not(:disabled)')];
      const index = rows.indexOf(event.target);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + rows.length) % rows.length;
      rows[next]?.focus();
    } else modal.onKeyDown(event);
  };
  return <dialog ref={dialog} tabIndex={-1} {...modal} onKeyDown={keys} className="shinka-place-sheet" aria-labelledby="place-sheet-title" data-shinka-layer>
    <header className="flex items-center justify-between gap-2 pb-4"><h2 id="place-sheet-title" className="font-heading text-shinka-h3">{label}</h2><ShinkaButton variant="ghost" onClick={close}>{mobileCopy('close', language)}</ShinkaButton></header>
    <div className="shinka-place-options" role="radiogroup" aria-label={label}>
      {options.map(option => <button key={option.id} type="button" className="shinka-place-option" role="radio" aria-checked={option.id === selected?.id} tabIndex={option.id === focusId ? 0 : -1} onFocus={() => setFocused(option.id)} data-place-option={option.id} disabled={disabled} onClick={() => { choose(option.id); close(); }}>
        {text(option)}{option.id === selected?.id && <span> · {mobileCopy('selected', language)}</span>}
      </button>)}
    </div>
    <footer className="pt-3">{children}</footer>
  </dialog>;
}

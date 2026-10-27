import { useEffect, useRef } from 'react';
import { useLayerHistory } from './useLayerHistory';

// Shared native modal focus and history behavior. Dismissal only hides a layer;
// controllers keep dispatched intents/recovery and pending guards separately.
export function useModalSurface(ref, onDismiss) {
  const latest = useRef(onDismiss); latest.current = onDismiss;
  const leaving = useRef(false);
  const leave = useLayerHistory(true, () => latest.current(), ref);
  const dismiss = () => { if (!leaving.current) { leaving.current = true; leave(() => {}); } };
  useEffect(() => {
    const dialog = ref.current, doc = dialog.ownerDocument, previous = doc.activeElement;
    dialog.showModal();
    (dialog.querySelector('[aria-checked="true"]') || dialog.querySelector('button:not(:disabled)') || dialog).focus();
    return () => { dialog.close(); if (previous?.isConnected) previous.focus(); };
  }, [ref]);
  return {
    dismiss,
    onCancel: event => { event.preventDefault(); dismiss(); },
    onKeyDown: event => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
      if (event.key === 'Tab') {
        event.preventDefault();
        const dialog = ref.current, controls = [...dialog.querySelectorAll('button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
        const index = controls.indexOf(dialog.ownerDocument.activeElement);
        (controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length] || dialog).focus();
      }
    },
  };
}

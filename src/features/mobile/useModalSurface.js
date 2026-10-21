import { useEffect, useRef } from 'react';
import { useLayerHistory } from './useLayerHistory';

// Shared native modal focus and history behavior. Dismissal only hides a layer;
// controllers keep dispatched intents/recovery and pending guards separately.
export function useModalSurface(ref, onDismiss) {
  const latest = useRef(onDismiss); latest.current = onDismiss;
  useLayerHistory(true, () => latest.current(), ref);
  useEffect(() => {
    const dialog = ref.current, doc = dialog.ownerDocument, previous = doc.activeElement;
    dialog.showModal();
    (dialog.querySelector('[aria-checked="true"]') || dialog.querySelector('button:not(:disabled)') || dialog).focus();
    return () => { dialog.close(); if (previous?.isConnected) previous.focus(); };
  }, [ref]);
  return {
    onCancel: event => { event.preventDefault(); latest.current(); },
    onKeyDown: event => {
      if (event.key === 'Escape') { event.preventDefault(); latest.current(); }
      if (event.key === 'Tab') {
        event.preventDefault();
        const dialog = ref.current, controls = [...dialog.querySelectorAll('button:not(:disabled):not([tabindex="-1"])')];
        const index = controls.indexOf(dialog.ownerDocument.activeElement);
        (controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length] || dialog).focus();
      }
    },
  };
}

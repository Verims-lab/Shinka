import { useModalSurface } from "@/features/mobile/useModalSurface";
import { useRef } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { privacyCopy } from '@/foundation/i18n/privacyCopy';

export default function PrivacyDialog({ kind, language, busy, onCancel, onConfirm }) {
  const dialog = useRef(null), copy = key => privacyCopy(key, language), deleting = kind === 'DELETE_ACCOUNT';
  const modal = useModalSurface(dialog, onCancel);
  return <dialog ref={dialog} tabIndex={-1} {...modal} aria-labelledby="privacy-confirm-title" aria-describedby="privacy-confirm-body" className="shinka-calendar-dialog rounded-shinka-lg border border-shinka-line bg-shinka-white p-5 text-shinka-ink">
    <h2 id="privacy-confirm-title" className="font-heading text-shinka-h3">{copy(deleting ? 'deleteTitle' : 'withdrawTitle')}</h2>
    <p id="privacy-confirm-body" className="my-4 text-shinka-body">{copy(deleting ? 'deleteBody' : 'withdrawBody')}</p>
    <div className="flex flex-col gap-3"><ShinkaButton variant="secondary" disabled={busy} onClick={onCancel}>{copy('cancel')}</ShinkaButton><ShinkaButton disabled={busy} onClick={onConfirm}>{copy(deleting ? 'confirmDelete' : 'confirmWithdraw')}</ShinkaButton></div>
  </dialog>;
}

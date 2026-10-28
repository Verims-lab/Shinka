import { notificationCopy } from '@/foundation/i18n/notificationCopy';
// No documented Base44 native permission bridge is available. Browser
// Notification.permission and user-agent guesses are intentionally not used.
/** @type {{support:string,permission:string}} */
export const UNKNOWN_NOTIFICATION_DEVICE = Object.freeze({ support:'UNKNOWN', permission:'UNKNOWN' });
export default function NotificationStatus({ language, enabled, draftEnabled = enabled, saving = false, unconfirmed = false, device = UNKNOWN_NOTIFICATION_DEVICE }) {
  const copy = key => notificationCopy(key, language);
  const support = ['SUPPORTED','UNSUPPORTED'].includes(device.support) ? device.support : 'UNKNOWN';
  const permission = support === 'SUPPORTED' && ['GRANTED','DENIED'].includes(device.permission) ? device.permission : 'UNKNOWN';
  const saveState = saving ? 'saving' : unconfirmed ? 'unconfirmed' : draftEnabled !== enabled ? 'unsaved' : 'saved';
  return <div className="space-y-2" data-notification-status>
    <p className="text-shinka-caption" data-notification-preference>{copy('preference')}: {copy(enabled ? 'on' : 'off')}</p>
    <p className="text-shinka-caption" id="you-notification-save-state" role="status" data-notification-save-state={saveState}>{saveState !== 'saved' && copy(saveState)}</p>
    <p className="text-shinka-caption" data-notification-permission>{copy('permission')}: {copy(`permission${permission}`)}</p>
    <p className="text-shinka-caption" id="you-notification-guidance">{copy(permission === 'DENIED' ? 'denied' : 'guidance')}</p>
    <p className="text-shinka-caption">{copy('setupPending')}</p>
  </div>;
}

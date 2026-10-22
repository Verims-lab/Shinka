import { notificationCopy } from '@/foundation/i18n/notificationCopy';
// No documented Base44 native permission bridge is available. Browser
// Notification.permission and user-agent guesses are intentionally not used.
/** @type {{support:string,permission:string}} */
export const UNKNOWN_NOTIFICATION_DEVICE = Object.freeze({ support:'UNKNOWN', permission:'UNKNOWN' });
export default function NotificationStatus({ language, enabled, device = UNKNOWN_NOTIFICATION_DEVICE }) {
  const copy = key => notificationCopy(key, language);
  const support = ['SUPPORTED','UNSUPPORTED'].includes(device.support) ? device.support : 'UNKNOWN';
  const permission = support === 'SUPPORTED' && ['GRANTED','DENIED'].includes(device.permission) ? device.permission : 'UNKNOWN';
  return <div className="space-y-2 text-shinka-caption" data-notification-status>
    <p data-notification-preference>{copy('preference')}: {copy(enabled ? 'on' : 'off')}</p>
    <p data-notification-support>{copy('support')}: {copy(`support${support}`)}</p>
    <p data-notification-permission>{copy('permission')}: {copy(`permission${permission}`)}</p>
    <p>{copy(permission === 'DENIED' ? 'denied' : 'guidance')}</p>
    <p>{copy('setupPending')}</p>
  </div>;
}

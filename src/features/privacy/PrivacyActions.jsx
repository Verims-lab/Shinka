import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { privacyCopy } from '@/foundation/i18n/privacyCopy';
import { privacyAction, privacyRecoveryStore } from '@/services/privacyService';
import { createPrivacyController } from './privacyController';
import PrivacyDialog from './PrivacyDialog';

/** @param {{language?:string, request?:(action:string,payload?:object)=>Promise<any>, recovery?:{read:()=>any,save:(value:any)=>void,clear:()=>void}, onRemoved?:()=>Promise<any>, authenticated?:boolean, deletionRestricted?:boolean, intent?:string}} props */
export default function PrivacyActions({ language = 'en', request = privacyAction, recovery = privacyRecoveryStore, onRemoved = async () => {}, authenticated = true, deletionRestricted = false, intent = null }) {
  const callback = useRef(onRemoved); callback.current = onRemoved;
  const controller = useMemo(() => createPrivacyController(request, recovery, { onRemoved: () => callback.current(), deletionRestricted }), [request, recovery, authenticated, deletionRestricted]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot), copy = key => privacyCopy(key, language);
  useEffect(() => {
    if (authenticated || deletionRestricted || recovery.read()) void controller.load();
    const ended = () => controller.invalidate();
    window.addEventListener('shinka-session-ended', ended);
    return () => { window.removeEventListener('shinka-session-ended', ended); controller.dispose(); };
  }, [controller]);
  const opened = useRef(false);
  useEffect(() => { if (!deletionRestricted && !opened.current && intent && state.value && !['IN_PROGRESS','PLATFORM_PENDING'].includes(state.value.state)) {
    opened.current = true;
    if (intent === 'WITHDRAW_HEALTH' ? state.value.canWithdraw : !state.value.accountProtected) controller.select(intent);
  } }, [deletionRestricted, intent, state.value, controller]);
  const value = state.value, platform = ['PLATFORM_PENDING', 'PLATFORM_REVIEW_REQUIRED'].includes(value?.state), working = value?.state === 'IN_PROGRESS' || state.pending && !platform && value?.state !== 'HEALTH_CLEANUP_COMPLETED';
  const needsLogin = ['AUTH_REQUIRED', 'PRIVACY_RECOVERY_INVALID'].includes(state.error);
  const errorCopy = state.error === 'PRIVACY_ADMIN_PROTECTED' ? 'protected' : state.error === 'PRIVACY_OTHER_OPERATION_PENDING' ? 'collision'
    : needsLogin ? deletionRestricted ? 'restrictedUnavailable' : 'signInRequired'
      : state.error === 'PRIVACY_STATUS_TIMEOUT' ? 'timeout' : state.error === 'PRIVACY_STATUS_UNAVAILABLE' ? 'unavailable' : 'unknown';
  const loginHref = `/login?returnTo=${encodeURIComponent(`/account-privacy?lang=${language}`)}`;
  return <div className="space-y-4" data-privacy-actions>
    {state.busy && <p role="status">{copy(['read', 'status'].includes(state.action) ? 'loading' : 'progress')}</p>}
    {value?.state === 'PLATFORM_PENDING' ? <p role="status" data-privacy-platform-pending>{copy('platform')}</p> : value?.state === 'HEALTH_CLEANUP_COMPLETED' ? <p role="status">{copy('cleaned')}</p> : working ? <p role="status">{copy(value?.consentWithdrawn ? 'withdrawn' : value?.state === 'IN_PROGRESS' ? 'inProgress' : 'partial')}</p> : null}
    {value?.state === 'PLATFORM_REVIEW_REQUIRED' && <p role="status">{copy('platformReview')}</p>}
    {state.error && <p role="alert">{copy(errorCopy)}</p>}
    {deletionRestricted && value?.state === 'IDLE' && <p role="status">{copy('restrictedUnavailable')}</p>}
    {!deletionRestricted && (needsLogin || !authenticated && value?.state === 'IN_PROGRESS') && <a className="inline-flex min-h-11 items-center text-shinka-plum" href={loginHref}>{copy('login')}</a>}
    {(deletionRestricted || working || state.error || platform) && <ShinkaButton variant="secondary" disabled={state.busy} onClick={controller.check}>{copy('check')}</ShinkaButton>}
    {(deletionRestricted ? value?.state === 'IN_PROGRESS' : working && authenticated && value) && !state.error && <ShinkaButton disabled={state.busy} onClick={controller.resume}>{copy('resume')}</ShinkaButton>}
    {!deletionRestricted && !working && authenticated && !platform && <>
      <ShinkaButton variant="secondary" disabled={state.busy || !value?.canWithdraw} onClick={() => controller.select('WITHDRAW_HEALTH')}>{copy('withdraw')}</ShinkaButton>
      {value && !value.canWithdraw && <p className="text-shinka-caption">{copy('noConsent')}</p>}
      <ShinkaButton variant="secondary" disabled={state.busy || value?.accountProtected || !value} onClick={() => controller.select('DELETE_ACCOUNT')}>{copy('delete')}</ShinkaButton>
      {value?.accountProtected && <p>{copy('protected')}</p>}
    </>}
    {state.selected && <PrivacyDialog kind={state.selected} language={language} busy={state.busy} onCancel={controller.cancel} onConfirm={controller.confirm}/>}
  </div>;
}

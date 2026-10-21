import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { privacyCopy } from '@/foundation/i18n/privacyCopy';
import { privacyRequest, privacyRecoveryStore } from '@/services/privacyService';
import { createPrivacyController } from './privacyController';
import PrivacyDialog from './PrivacyDialog';

/** @param {{language?:string, request?:(action:string,payload?:object)=>Promise<any>, recovery?:{read:()=>any,save:(value:any)=>void,clear:()=>void}, onRemoved?:()=>Promise<any>, authenticated?:boolean, intent?:string}} props */
export default function PrivacyActions({ language = 'en', request = privacyRequest, recovery = privacyRecoveryStore, onRemoved = async () => {}, authenticated = true, intent = null }) {
  const callback = useRef(onRemoved); callback.current = onRemoved;
  const controller = useMemo(() => createPrivacyController(request, recovery, { onRemoved: () => callback.current() }), [request, recovery]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot), copy = key => privacyCopy(key, language);
  useEffect(() => { if (authenticated || recovery.read()) void controller.load(); return () => controller.dispose(); }, [controller]);
  const opened = useRef(false);
  useEffect(() => { if (!opened.current && intent && state.value && !['IN_PROGRESS','PLATFORM_PENDING'].includes(state.value.state)) {
    opened.current = true;
    if (intent === 'WITHDRAW_HEALTH' ? state.value.canWithdraw : !state.value.accountProtected) controller.select(intent);
  } }, [intent, state.value, controller]);
  const value = state.value, platform = ['PLATFORM_PENDING', 'PLATFORM_REVIEW_REQUIRED'].includes(value?.state), working = value?.state === 'IN_PROGRESS' || state.pending && !platform && value?.state !== 'HEALTH_CLEANUP_COMPLETED';
  return <div className="space-y-4" data-privacy-actions>
    {state.busy && <p role="status">{copy(value ? 'progress' : 'loading')}</p>}
    {value?.state === 'PLATFORM_PENDING' ? <p role="status" data-privacy-platform-pending>{copy('platform')}</p> : value?.state === 'HEALTH_CLEANUP_COMPLETED' ? <p role="status">{copy('cleaned')}</p> : working ? <p role="status">{copy(value?.consentWithdrawn ? 'withdrawn' : 'partial')}</p> : null}
    {value?.state === 'PLATFORM_REVIEW_REQUIRED' && <p role="status">{copy('platformReview')}</p>}
    {state.error && <p role="alert">{copy(state.error === 'PRIVACY_ADMIN_PROTECTED' ? 'protected' : state.error === 'PRIVACY_OTHER_OPERATION_PENDING' ? 'collision' : 'unknown')}</p>}
    {(working || state.error || platform) && <ShinkaButton variant="secondary" disabled={state.busy} onClick={controller.check}>{copy('check')}</ShinkaButton>}
    {working && authenticated && <ShinkaButton disabled={state.busy} onClick={controller.resume}>{copy('resume')}</ShinkaButton>}
    {!working && authenticated && !platform && <>
      <ShinkaButton variant="secondary" disabled={state.busy || !value?.canWithdraw} onClick={() => controller.select('WITHDRAW_HEALTH')}>{copy('withdraw')}</ShinkaButton>
      {value && !value.canWithdraw && <p className="text-shinka-caption">{copy('noConsent')}</p>}
      <ShinkaButton variant="secondary" disabled={state.busy || value?.accountProtected || !value} onClick={() => controller.select('DELETE_ACCOUNT')}>{copy('delete')}</ShinkaButton>
      {value?.accountProtected && <p>{copy('protected')}</p>}
    </>}
    {state.selected && <PrivacyDialog kind={state.selected} language={language} busy={state.busy} onCancel={controller.cancel} onConfirm={controller.confirm}/>}
  </div>;
}

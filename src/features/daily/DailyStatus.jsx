import ShinkaButton from '@/components/shinka/ShinkaButton';
import { dailyCopy } from '@/foundation/i18n/dailyCopy';
import { dailyErrorState, safeDailyErrorCode } from '@/services/dailyMessageService';
export default function DailyStatus({ loading, error, reload, language, value = null, diagnostic = null }) {
  return <div className="space-y-5" aria-busy={loading} data-daily-state={loading ? 'loading' : dailyErrorState(error)} data-error-code={error ? safeDailyErrorCode(error) : undefined}
    data-error-stage={diagnostic?.stage} data-error-duration={diagnostic?.durationMs} data-request-id={diagnostic?.requestId} data-http-status={diagnostic?.httpStatus}>
    <p role={loading ? 'status' : 'alert'}>{dailyCopy(loading ? 'loading' : value?.daily ? 'refreshFailure' : dailyErrorState(error), language)}</p>
    {!loading && <ShinkaButton onClick={reload}>{dailyCopy('retry', language)}</ShinkaButton>}
  </div>;
}

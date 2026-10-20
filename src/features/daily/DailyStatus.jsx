import ShinkaButton from '@/components/shinka/ShinkaButton';
import { dailyCopy } from '@/foundation/i18n/dailyCopy';
import { dailyErrorState } from '@/services/dailyMessageService';
export default function DailyStatus({ loading, error, reload, language }) {
  return <div className="space-y-5" aria-busy={loading} data-daily-state={loading ? 'loading' : dailyErrorState(error)} data-error-code={error || undefined}>
    <p role={loading ? 'status' : 'alert'}>{dailyCopy(loading ? 'loading' : dailyErrorState(error), language)}</p>
    {!loading && <ShinkaButton onClick={reload}>{dailyCopy('retry', language)}</ShinkaButton>}
  </div>;
}

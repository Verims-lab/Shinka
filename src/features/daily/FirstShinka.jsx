import { useEffect, useRef } from 'react';
import { useDailyMessage } from './useDailyMessage';
import DailyStatus from './DailyStatus';
import { onboardingCopy } from '@/foundation/i18n/onboardingCopy';
export default function FirstShinka({ language, onReady, request = undefined }) {
  const daily = useDailyMessage(request);
  const delivered = useRef(null);
  useEffect(() => { if (daily.value && delivered.current !== daily.value.daily.id) { delivered.current = daily.value.daily.id; onReady(daily.value); } }, [daily.value, onReady]);
  return <div className="space-y-5" data-dependency={daily.error === 'DAILY_ATOMIC_CAPABILITY_REQUIRED' ? 'FIRST_SHINKA_ENGINE_REQUIRED' : undefined}>
    <p>{onboardingCopy('preparing', language)}</p>
    {!daily.value && <DailyStatus {...daily} language={language}/>}
  </div>;
}

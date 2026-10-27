import { patternCopy } from '@/foundation/i18n/patternCopy';
export default function LunarSummary({ lunar, language }) {
  const copy = key => patternCopy(key, language);
  // The date is already resolved from trusted server time + validated IANA zone.
  const date = lunar.next_full?.date;
  const label = date && new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
  return <dl data-lunar-summary className="space-y-4">
    <div><dt className="text-shinka-caption">{copy('currentPhase')}</dt><dd data-lunar-current className="text-shinka-body-lg">{lunar.current ? copy(lunar.current.phase_code) : copy('unavailable')}</dd></div>
    <div><dt className="text-shinka-caption">{copy('nextFull')}</dt><dd data-next-full className="text-shinka-body-lg">{date ? <time dateTime={date}>{label}</time> : copy('unavailable')}</dd></div>
  </dl>;
}

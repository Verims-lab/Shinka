import RefreshControl from "@/features/mobile/RefreshControl";
import { useEffect, useState } from 'react';
import ProductNavigation from '@/components/shinka/ProductNavigation';
import ProfileMenu from '@/components/profile/ProfileMenu';
import ProfileLogoSlot from '@/components/profile/ProfileLogoSlot';
import ShinkaCard from '@/components/shinka/ShinkaCard';
import { resolveLanguage } from '@/foundation/i18n/strings';
import { dailyCopy } from '@/foundation/i18n/dailyCopy';
import { useDailyMessage } from '@/features/daily/useDailyMessage';
import DailyStatus from '@/features/daily/DailyStatus';
export default function Home({ profileAccess = undefined, renderProfileAccess = undefined, language: initialLanguage = undefined, initialDaily = null, profile = null, request = undefined, active = true }) {
  const [language, setLanguage] = useState(initialLanguage || resolveLanguage());
  useEffect(() => { if(initialLanguage) setLanguage(initialLanguage); }, [initialLanguage]);
  const daily = useDailyMessage(request, initialDaily, undefined, active);
  const name = daily.value ? daily.value.profile ? daily.value.profile.display_name : profile?.display_name : null;
  const row = daily.value?.daily;
  const copy = key => dailyCopy(key, language);
  return <div className="relative shinka-viewport shinka-safe-shell text-shinka-ink font-body flex flex-col" lang={language} data-home-root>
    <main className="flex-1 w-full max-w-xl mx-auto px-5 py-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 flex-1 font-heading font-medium text-shinka-h2 break-words">{copy('greeting')}{name?.trim() ? `, ${name.trim()}` : ''}</h1>
        <div className="shrink-0"><ProfileLogoSlot>{renderProfileAccess?.(language) || profileAccess || <ProfileMenu language={language}/>}</ProfileLogoSlot></div>
      </header>
      <RefreshControl showButton={false} language={language} refresh={daily.reload} loading={daily.loading} error={null}/>
      {row ? <div className="space-y-5" data-daily-id={row.id}>
        <div className="rounded-shinka-lg" style={{ backgroundColor: 'rgb(var(--shinka-white) / 0.8)' }} data-home-card="message">
          <ShinkaCard surface="plain" title={copy('shinka')}><p className="text-shinka-body whitespace-pre-wrap break-words" data-daily-message>{row[`message_${language}_snapshot`]}</p></ShinkaCard>
        </div>
        <div className="rounded-shinka-lg" style={{ backgroundColor: 'rgb(var(--shinka-white) / 0.8)' }} data-home-card="suggestion">
          <ShinkaCard surface="plain">
            <h2 className="font-heading font-medium text-shinka-h4 text-shinka-plum-deep mb-3">{copy('suggestion')}</h2>
            <p className="text-shinka-body italic whitespace-pre-wrap break-words border-l pl-4" style={{ borderLeftColor: 'rgb(var(--shinka-plum) / 0.3)' }} data-daily-suggestion>{row[`suggestion_${language}_snapshot`]}</p>
          </ShinkaCard>
        </div>
        {daily.error && <DailyStatus {...daily} language={language}/>}
      </div> : <ShinkaCard surface="plain"><DailyStatus {...daily} language={language}/></ShinkaCard>}
    </main>
    <ProductNavigation current="home" language={language}/>
  </div>;
}

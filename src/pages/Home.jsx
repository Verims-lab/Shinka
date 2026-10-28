import RefreshControl from "@/features/mobile/RefreshControl";
import { useEffect, useState } from 'react';
import ProductNavigation from '@/components/shinka/ProductNavigation';
import ProfileMenu from '@/components/profile/ProfileMenu';
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
  return <div className="shinka-viewport shinka-safe-shell bg-shinka-ivory text-shinka-ink font-body flex flex-col" lang={language} data-home-root>
    <header className="flex flex-wrap items-center justify-between px-5 pt-6 gap-2">
      <span className="font-heading font-medium text-shinka-h3 text-shinka-plum">Shinka</span>
      {renderProfileAccess?.(language) || profileAccess || <ProfileMenu language={language}/>}
    </header>
    <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8 space-y-6">
      <h1 className="font-heading font-medium text-shinka-h1 break-words">{copy('greeting')}{name?.trim() ? `, ${name.trim()}` : ''}</h1>
      <RefreshControl showButton={false} language={language} refresh={daily.reload} loading={daily.loading} error={daily.error}/>
      {row ? <div className="space-y-5" data-daily-id={row.id}>
        <ShinkaCard title={copy('shinka')}><p className="text-shinka-body-lg whitespace-pre-wrap break-words" data-daily-message>{row[`message_${language}_snapshot`]}</p></ShinkaCard>
        <ShinkaCard title={copy('suggestion')}><p className="text-shinka-body-lg whitespace-pre-wrap break-words" data-daily-suggestion>{row[`suggestion_${language}_snapshot`]}</p></ShinkaCard>
        {daily.error && <DailyStatus {...daily} language={language}/>}
      </div> : <ShinkaCard><DailyStatus {...daily} language={language}/></ShinkaCard>}
    </main>
    <ProductNavigation current="home" language={language}/>
  </div>;
}
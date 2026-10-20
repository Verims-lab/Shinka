import { useState } from 'react';
import ProductNavigation from '@/components/shinka/ProductNavigation';
import ProfileMenu from '@/components/profile/ProfileMenu';
import ShinkaCard from '@/components/shinka/ShinkaCard';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import { resolveLanguage } from '@/foundation/i18n/strings';
import { dailyCopy, greetingKey } from '@/foundation/i18n/dailyCopy';
import { useDailyMessage } from '@/features/daily/useDailyMessage';
import DailyStatus from '@/features/daily/DailyStatus';
export default function Home({ profileAccess = undefined, renderProfileAccess = undefined, language: initialLanguage = undefined, initialDaily = null, profile = null, request = undefined }) {
  const [language, setLanguage] = useState(initialLanguage || resolveLanguage());
  const daily = useDailyMessage(request, initialDaily);
  const name = daily.value?.profile?.display_name || profile?.display_name;
  const row = daily.value?.daily;
  const copy = key => dailyCopy(key, language);
  return <div className="shinka-viewport shinka-safe-shell bg-shinka-ivory text-shinka-ink font-body flex flex-col" lang={language} data-home-root>
    <header className="flex items-center justify-between px-5 pt-6 gap-2">
      <span className="font-heading font-medium text-shinka-h3 text-shinka-plum">Shinka</span>
      <div className="flex gap-1">{['tr', 'en'].map(lang => <ShinkaButton key={lang} variant="ghost" aria-pressed={language === lang} onClick={() => setLanguage(lang)}>{lang.toUpperCase()}</ShinkaButton>)}
        {renderProfileAccess?.(language) || profileAccess || <ProfileMenu language={language}/>}</div>
    </header>
    <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8 space-y-6">
      <h1 className="font-heading font-medium text-shinka-h1 break-words">{copy(greetingKey())}{name ? `, ${name}` : ''}</h1>
      {row ? <div className="space-y-5" data-daily-id={row.id}>
        <ShinkaCard title={copy('shinka')}><p className="text-shinka-body-lg whitespace-pre-wrap break-words" data-daily-message>{row[`message_${language}_snapshot`]}</p></ShinkaCard>
        <ShinkaCard title={copy('suggestion')}><p className="text-shinka-body-lg whitespace-pre-wrap break-words" data-daily-suggestion>{row[`suggestion_${language}_snapshot`]}</p></ShinkaCard>
      </div> : <ShinkaCard><DailyStatus {...daily} language={language}/></ShinkaCard>}
    </main>
    <ProductNavigation current="home" language={language}/>
  </div>;
}

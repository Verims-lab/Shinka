import { useEffect, useState } from 'react';
import ProfileMenu from '@/components/profile/ProfileMenu';
import ShinkaButton from '@/components/shinka/ShinkaButton';
import ShinkaCard from '@/components/shinka/ShinkaCard';
import ProductNavigation from '@/components/shinka/ProductNavigation';
import { patternCopy } from '@/foundation/i18n/patternCopy';
import { usePattern } from '@/features/pattern/usePattern';
import LunarSummary from '@/features/pattern/LunarSummary';
export default function Pattern({ language: initialLanguage = 'en', renderProfileAccess = undefined, request = undefined, runtime = undefined }) {
  const [language, setLanguage] = useState(initialLanguage);
  useEffect(() => { if(initialLanguage) setLanguage(initialLanguage); }, [initialLanguage]);
  const state = usePattern(request, runtime), copy = key => patternCopy(key, language);
  return <div lang={language} data-pattern-root className="shinka-viewport shinka-safe-shell bg-shinka-ivory text-shinka-ink font-body flex flex-col">
    <header className="flex flex-wrap items-center justify-between px-5 pt-6 gap-2">
      <span className="font-heading font-medium text-shinka-h3 text-shinka-plum">Shinka</span>
      {renderProfileAccess?.(language) || <ProfileMenu language={language}/>}
    </header>
    <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8 space-y-6">
      <h1 className="font-heading text-shinka-h1">{copy('title')}</h1>
      {['themes', 'lunar'].map(section => {
        const part = state[section];
        return <section key={section} aria-labelledby={`pattern-${section}`} aria-busy={part.loading} data-pattern-section={section}>
          <ShinkaCard><h2 id={`pattern-${section}`} className="font-heading text-shinka-h3 mb-4">{copy(section)}</h2>
            {part.loading && !part.value && <p role="status">{copy('loading')}</p>}
            {part.error && <div role="alert" className="space-y-3"><p>{copy(part.value ? 'refreshError' : section === 'lunar' && part.error.startsWith('MOON_LOOKUP_') ? 'unavailable' : `${section}Error`)}</p><ShinkaButton variant="secondary" onClick={() => state.controller.load(section)}>{copy('retry')}</ShinkaButton></div>}
            {part.value && (section === 'themes' ? part.value.state === 'EMPTY' ? <p role="status">{copy('empty')}</p> : <ul className="space-y-4">{part.value.themes.map(theme => <li key={theme.id} data-theme-id={theme.id} className="break-words text-shinka-body-lg">{theme[`display_name_${language}`]}</li>)}</ul> : <LunarSummary lunar={part.value.lunar} language={language}/>)}
          </ShinkaCard>
        </section>;
      })}
    </main>
    <ProductNavigation current="pattern" language={language}/>
  </div>;
}
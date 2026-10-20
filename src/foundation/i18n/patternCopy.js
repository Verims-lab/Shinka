import { APPROVED_COPY } from '../uiuxTables';
// EN state copy: SRC-03 verbatim. TR/UI labels: scoped Pattern request, 021.
export const PATTERN_COPY = Object.freeze({
  en: { title: 'Pattern', themes: 'Your Recurring Themes', lunar: 'Lunar Timeline', today: 'Today', active: 'Current phase',
    loading: 'Loading…', retry: 'Try again', empty: APPROVED_COPY.pattern[0], themesError: APPROVED_COPY.pattern[1], lunarError: APPROVED_COPY.pattern[2], unavailable: APPROVED_COPY.pattern[3],
    NEW: 'New Moon', WAXING: 'Waxing Moon', FULL: 'Full Moon', WANING: 'Waning Moon', day: 'day', days: 'days', timezone: 'Time zone' },
  tr: { title: 'Pattern', themes: 'Tekrarlayan Temaların', lunar: 'Ay Zaman Çizelgesi', today: 'Bugün', active: 'Güncel evre',
    loading: 'Yükleniyor…', retry: 'Tekrar dene', empty: 'Temaların ilk Shinka’ndan sonra görünecek', themesError: 'Temalarını yükleyemedik. Lütfen tekrar dene', lunarError: 'Ay zaman çizelgesini yükleyemedik. Lütfen tekrar dene', unavailable: 'Ay evresi bilgisi şu anda kullanılamıyor',
    NEW: 'Yeni Ay', WAXING: 'Büyüyen Ay', FULL: 'Dolunay', WANING: 'Küçülen Ay', day: 'gün', days: 'gün', timezone: 'Saat dilimi' },
});
export const patternCopy = (key, language = 'en') => PATTERN_COPY[language === 'tr' ? 'tr' : 'en'][key] || key;

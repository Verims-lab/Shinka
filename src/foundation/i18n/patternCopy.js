import { APPROVED_COPY } from '../uiuxTables';
// Original empty/theme/unavailable copy retained; single theme / timeline presentation follows the explicit 059 request.
export const PATTERN_COPY = Object.freeze({
  en: { title: 'Pattern', themes: 'Your Recurring Themes', lunar: 'Lunar Timeline', nextNew: 'Next New Moon', today: 'Today', active: 'Current phase', timezone: 'Time zone', currentPhase: 'Current Moon phase', refreshError: 'We couldn’t refresh this information. Please try again',
    loading: 'Loading…', retry: 'Try again', empty: APPROVED_COPY.pattern[0], themesError: APPROVED_COPY.pattern[1], lunarError: 'We couldn’t load the Moon information. Please try again', unavailable: APPROVED_COPY.pattern[3],
    NEW: 'New Moon', WAXING: 'Waxing Moon', FULL: 'Full Moon', WANING: 'Waning Moon' },
  tr: { title: 'Pattern', themes: 'Tekrarlayan Temaların', lunar: 'Ay Zaman Çizelgesi', nextNew: 'Sonraki Yeni Ay', today: 'Bugün', active: 'Güncel evre', timezone: 'Saat dilimi', currentPhase: 'Güncel Ay evresi', refreshError: 'Bilgiler yenilenemedi. Lütfen tekrar dene',
    loading: 'Yükleniyor…', retry: 'Tekrar dene', empty: 'Temaların ilk Shinka’ndan sonra görünecek', themesError: 'Temalarını yükleyemedik. Lütfen tekrar dene', lunarError: 'Ay bilgilerini yükleyemedik. Lütfen tekrar dene', unavailable: 'Ay evresi bilgisi şu anda kullanılamıyor',
    NEW: 'Yeni Ay', WAXING: 'Büyüyen Ay', FULL: 'Dolunay', WANING: 'Küçülen Ay' },
});
export const patternCopy = (key, language = 'en') => PATTERN_COPY[language === 'tr' ? 'tr' : 'en'][key] || key;

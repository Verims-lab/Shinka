// SRC-03 Home EN copy; scoped TR translations for the daily/Home request.
const COPY = {
  en: { greeting: 'Hello', shinka: 'Your Shinka', suggestion: 'Today’s Suggestion', refreshFailure: 'Couldn’t refresh. Your last view is still shown. Try again',
    loading: 'Your Shinka is on its way', offline: 'You’re offline. Please check your connection', failure: 'We couldn’t load your Shinka. Please try again', notReady: 'Your Shinka isn’t ready yet. Please try again shortly', retry: 'Retry', navigation: 'Main navigation' },
  tr: { greeting: 'Merhaba', shinka: 'Senin Shinka’n', suggestion: 'Bugünün önerisi', refreshFailure: 'Yenilenemedi. Son görüntü korunuyor. Tekrar dene',
    loading: 'Shinka’n yolda', offline: 'Çevrimdışısın. Lütfen bağlantını kontrol et', failure: 'Shinka’n yüklenemedi. Lütfen tekrar dene', notReady: 'Shinka’n henüz hazır değil. Lütfen biraz sonra tekrar dene', retry: 'Tekrar dene', navigation: 'Ana gezinme' },
};
export const dailyCopy = (key, language) => COPY[language === 'tr' ? 'tr' : 'en'][key];

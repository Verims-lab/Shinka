const copy = {
  en: { refresh: 'Refresh', pull: 'Pull down to refresh', release: 'Release to refresh', refreshing: 'Refreshing', refreshError: 'Couldn’t refresh. Your last view is still shown. Try again', close: 'Close', selected: 'Selected', check: 'Check / retry the same change', unknown: 'This change may have been saved. Check it before making another change' },
  tr: { refresh: 'Yenile', pull: 'Yenilemek için aşağı çek', release: 'Yenilemek için bırak', refreshing: 'Yenileniyor', refreshError: 'Yenilenemedi. Son görüntü korunuyor. Tekrar dene', close: 'Kapat', selected: 'Seçili', check: 'Kontrol et / aynı işlemi tekrar dene', unknown: 'Bu değişiklik kaydedilmiş olabilir. Başka bir değişiklik yapmadan önce kontrol et' },
};
export const mobileCopy = (key, language) => (copy[language] || copy.en)[key];

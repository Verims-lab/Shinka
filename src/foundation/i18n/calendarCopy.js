import { APPROVED_COPY } from '../uiuxTables';

const en = {
  title: 'Calendar', previous: 'Previous month', next: 'Next month', period: 'Period', predicted: 'Predicted', selected: 'Selected',
  mark: 'Mark period start', date: 'Period start date', editing: 'Editing period start', stopEditing: 'Cancel editing',
  loading: 'Loading your calendar', saving: 'Saving your changes', retry: 'Retry', reload: 'Refresh calendar',
  loadError: 'We couldn’t load your calendar. Please try again',
  unavailable: 'Changes are temporarily unavailable. Your saved records are unchanged',
  calculation: 'Predictions are unavailable for this cycle interval. Your recorded dates are unchanged',
  estimateUnavailable: 'Your recorded dates are preserved. A prediction or current phase cannot be calculated because the latest completed intervals are longer than 60 days',
  changed: 'Your calendar has changed. Refresh it before trying again',
  saved: 'Period start saved', start: 'Recorded period start',
  deletionPending: 'Your previous health data deletion must finish before you can consent again',
  required: APPROVED_COPY.calendar[0], future: APPROVED_COPY.calendar[1], invalid: APPROVED_COPY.calendar[2],
  duplicate: APPROVED_COPY.calendar[3], conflict: APPROVED_COPY.calendar[4], saveError: APPROVED_COPY.calendar[5],
  offline: APPROVED_COPY.calendar[6], consent: APPROVED_COPY.calendar[7], deleteTitle: APPROVED_COPY.calendar[8],
  deleteBody: APPROVED_COPY.calendar[9], delete: APPROVED_COPY.calendar[10], cancel: APPROVED_COPY.calendar[11],
  deleteError: APPROVED_COPY.calendar[12], deleted: APPROVED_COPY.calendar[13], empty: APPROVED_COPY.calendar[14],
};
const tr = {
  title: 'Takvim', previous: 'Önceki ay', next: 'Sonraki ay', period: 'Regl', predicted: 'Tahmini', selected: 'Seçili',
  mark: 'Regl başlangıcını işaretle', date: 'Regl başlangıç tarihi', editing: 'Düzenlenen regl başlangıcı', stopEditing: 'Düzenlemeyi iptal et',
  loading: 'Takvimin yükleniyor', saving: 'Değişikliklerin kaydediliyor', retry: 'Tekrar dene', reload: 'Takvimi yenile',
  loadError: 'Takvimin yüklenemedi. Lütfen tekrar dene',
  unavailable: 'Değişiklikler şu anda kaydedilemiyor. Kayıtlı bilgilerin korunuyor',
  calculation: 'Bu döngü aralığı için tahmin hesaplanamıyor. Kayıtlı tarihlerin korunuyor',
  estimateUnavailable: 'Kayıtlı tarihlerin korunuyor. Son tamamlanmış aralıklar 60 günden uzun olduğu için tahmin ve güncel evre hesaplanamıyor',
  changed: 'Takvimin değişti. Tekrar denemeden önce yenile',
  saved: 'Regl başlangıcı kaydedildi', start: 'Kayıtlı regl başlangıcı',
  deletionPending: 'Yeniden izin vermeden önce önceki sağlık verilerinin silinmesi tamamlanmalı',
  required: 'Lütfen bir tarih seç', future: 'Regl başlangıç tarihi gelecekte olamaz', invalid: 'Lütfen geçerli bir tarih seç',
  duplicate: 'Bu tarih zaten regl başlangıcı olarak kayıtlı', conflict: 'Bu tarih mevcut bir regl kaydıyla çakışıyor',
  saveError: 'Regl başlangıcın kaydedilemedi. Lütfen tekrar dene', offline: 'Çevrimdışısın. Lütfen bağlantını kontrol et',
  consent: 'Devam etmek için döngü verilerinin kullanılmasına açık rıza vermelisin',
  deleteTitle: 'Bu regl başlangıcı silinsin mi?', deleteBody: 'Bu regl başlangıcı silinecek. Döngü tahminlerin güncellenecek',
  delete: 'Regl başlangıcını sil', cancel: 'İptal', deleteError: 'Bu regl başlangıcı silinemedi. Lütfen tekrar dene',
  deleted: 'Regl başlangıcı silindi', empty: 'Henüz regl tahmini yok. Tahminleri görmek için bir regl başlangıcı işaretle',
};
export const calendarCopy = (key, language = 'en') => (language === 'tr' ? tr : en)[key] || en[key];
export const calendarErrorKey = (code, action = 'read') => ({
  PERIOD_DATE_REQUIRED: 'required', PERIOD_DATE_INVALID: 'invalid', PERIOD_START_FUTURE: 'future',
  PERIOD_DUPLICATE: 'duplicate', PERIOD_CONFLICT: 'conflict', CALENDAR_ATOMIC_CAPABILITY_REQUIRED: 'unavailable',
  CYCLE_RANGE_DECISION_REQUIRED: 'calculation', CALENDAR_HISTORY_LIMIT: 'calculation',
  CALENDAR_STATE_CHANGED: 'changed', WRITE_CONFLICT: 'changed', ACTION_CONFLICT: 'changed', PERIOD_NOT_FOUND: 'changed',
  HEALTH_CONSENT_REQUIRED: 'consent', HEALTH_DELETION_PENDING: 'deletionPending', HEALTH_DELETION_UNCONFIRMED: 'deletionPending',
}[code] || (code === 'NETWORK' && globalThis.navigator?.onLine === false ? 'offline' : action === 'read' ? 'loadError' : action === 'delete' ? 'deleteError' : 'saveError'));

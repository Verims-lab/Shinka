// Scoped TR/EN product copy for the explicit 023 privacy request. Existing
// deactivation source text remains historical; it is not used for real erasure.
const copy = {
  tr: {
    title: 'Hesap ve Gizlilik', back: 'Geri', withdraw: 'Sağlık verisi onamımı geri çek', delete: 'Hesabımı sil',
    withdrawTitle: 'Sağlık verisi onamını geri çekmek istiyor musun?', deleteTitle: 'Hesabını silmek istiyor musun?',
    withdrawBody: 'Döngü ayarların, regl kayıtların, tahminlerin, hesaplanan evrelerin ve takvim işlem kayıtların temizlenecek. Hesabın, profilin, geçmiş günlük içeriklerin ve onam tarihçen korunacak. Temizlik bitene kadar sağlık verilerin işlenmeyecek',
    deleteBody: "Hesabın ve kişisel bilgilerin uygulamadan kaldırılacak ve artık Shinka'ya erişemeyeceksin. Kalıcı silme, doğrulanana kadar beklemede kalacak.",
    cancel: 'Vazgeç', confirmWithdraw: 'Onamı geri çek ve temizle', confirmDelete: 'Hesabımı Sil',
    loading: 'Durum kontrol ediliyor', inProgress: 'Talebin devam ediyor. Henüz tamamlanmadı', unavailable: 'Durum geçici olarak sorgulanamadı. Lütfen tekrar dene', timeout: 'Durum kontrolü zamanında tamamlanamadı. Lütfen tekrar dene', signInRequired: 'Durumu kontrol etmek için mevcut sağlayıcınla yeniden giriş yap. Profilini veya onboarding adımlarını tamamlaman gerekmez', progress: 'Talebin işleniyor', partial: 'Bu cihazda bir talep kayıtlı. Sonucu henüz doğrulanmadı',
    withdrawn: 'Onamın geri çekildi. Sağlık verilerinin temizliği henüz tamamlanmadı',
    cleaned: 'Onamın geri çekildi ve sağlık kayıtlarının aktif verilerden temizlendiği doğrulandı. Hesabın aktif',
    platform: 'Hesabın ve uygulamadaki aktif kişisel kayıtların kaldırıldı. Kalıcı platform silmesi ve sağlayıcı doğrulaması beklemede.',
    platformReview: 'Giriş hesabın kaldırıldı ancak kişisel kayıt temizliği doğrulanamadı. Talebin kayıtlı; platform incelemesi gerekiyor. İşlem tamamlandı sayılmıyor',
    unknown: 'Sonuç henüz doğrulanamadı. Yeni talep oluşturmadan durumunu kontrol et',
    check: 'Durumu kontrol et', resume: 'Devam et', login: 'Apple veya Google ile giriş yap',
    loginBody: 'Shinka hesabını silmek için mevcut giriş sağlayıcınla oturum aç. Profilini veya onboarding adımlarını tamamlaman gerekmez',
    protected: 'Bu hesap yönetici erişimi taşıyor. Uygulama sahibi ve son yönetici koruması nedeniyle bu ekrandan silinemez',
    noConsent: 'Geri çekilecek aktif sağlık verisi onamın yok', error: 'İşlem doğrulanamadı. Lütfen tekrar dene',
    collision: 'Başka bir hesap işlemi devam ediyor. Yeni işlem başlatılmadı',
    external: 'Shinka hesap silme talebi', signOut: 'Çıkış yap',
  },
  en: {
    title: 'Account & Privacy', back: 'Back', withdraw: 'Withdraw my health data consent', delete: 'Delete my account',
    withdrawTitle: 'Withdraw health data consent?', deleteTitle: 'Delete your account?',
    withdrawBody: 'Your cycle settings, period records, predictions, calculated phases and calendar operation records will be cleared. Your account, profile, past daily content and consent history will remain. Health data processing stops while cleanup is pending',
    deleteBody: 'Your account and personal information will be removed from the app, and you will no longer be able to access Shinka. Permanent deletion will remain pending until it is verified.',
    cancel: 'Cancel', confirmWithdraw: 'Withdraw consent and clear data', confirmDelete: 'Delete Account',
    loading: 'Checking status', inProgress: 'Your request is in progress. It is not complete yet', unavailable: 'Status is temporarily unavailable. Please try again', timeout: 'The status check did not finish in time. Please try again', signInRequired: 'Sign in again with your existing provider to check the status. You do not need to complete your profile or onboarding', progress: 'Processing your request', partial: 'A request is saved on this device. Its outcome has not yet been verified',
    withdrawn: 'Consent is withdrawn. Health data cleanup is still pending',
    cleaned: 'Consent is withdrawn and removal of active health records is verified. Your account remains active',
    platform: 'Your account and active personal app records have been removed. Permanent platform erasure and provider verification remain pending.',
    platformReview: 'Your sign-in account was removed, but personal data cleanup could not be verified. Your request is saved and needs platform review. The operation is not complete',
    unknown: 'The outcome is not yet confirmed. Check its status without creating a new request',
    check: 'Check status', resume: 'Continue', login: 'Sign in with Apple or Google',
    loginBody: 'To delete your Shinka account, sign in with your existing provider. You do not need to complete your profile or onboarding',
    protected: 'This account has administrator access. App-owner and last-admin protection prevent removal from this screen',
    noConsent: 'You have no active health data consent to withdraw', error: 'The operation could not be confirmed. Please try again',
    collision: 'Another account operation is in progress. No new operation was started',
    external: 'Shinka account deletion request', signOut: 'Sign out',
  },
};
export const privacyCopy = (key, language = 'en') => copy[language === 'tr' ? 'tr' : 'en'][key];
export const PRIVACY_COPY = copy;

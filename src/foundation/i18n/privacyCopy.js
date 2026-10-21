// Scoped TR/EN product copy for the explicit 023 privacy request. Existing
// deactivation source text remains historical; it is not used for real erasure.
const copy = {
  tr: {
    title: 'Hesap ve Gizlilik', back: 'Geri', withdraw: 'Sağlık verisi onamımı geri çek', delete: 'Hesabımı sil',
    withdrawTitle: 'Sağlık verisi onamını geri çekmek istiyor musun?', deleteTitle: 'Hesabını silmek istiyor musun?',
    withdrawBody: 'Döngü ayarların, regl kayıtların, tahminlerin, hesaplanan evrelerin ve takvim işlem kayıtların temizlenecek. Hesabın, profilin, geçmiş günlük içeriklerin ve onam tarihçen korunacak. Temizlik bitene kadar sağlık verilerin işlenmeyecek',
    deleteBody: 'Hesabın ve sana bağlı profil, tercihler, döngü, günlük içerik, Pattern, bildirim ve onam kayıtları uygulamanın aktif verilerinden kaldırılacak. Uygulamaya erişimin duracak. Base44 geri dönüşüm alanları ve sağlayıcı işlemleri ayrıca doğrulanana kadar kalıcı silme beklemede kalacak',
    cancel: 'Vazgeç', confirmWithdraw: 'Onamı geri çek ve temizle', confirmDelete: 'Silme talebini başlat',
    loading: 'Durum kontrol ediliyor', progress: 'Talebin işleniyor', partial: 'Talebin kayıtlı. Temizliği aynı talep üzerinden sürdürebilirsin',
    withdrawn: 'Onamın geri çekildi. Sağlık verilerinin temizliği henüz tamamlanmadı',
    cleaned: 'Onamın geri çekildi ve sağlık kayıtlarının aktif verilerden temizlendiği doğrulandı. Hesabın aktif',
    platform: 'Hesabın ve uygulamadaki aktif kişisel kayıtların kaldırıldı. Kalıcı platform silmesi ve sağlayıcı doğrulaması beklemede. Oturumun kapatıldı',
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
    deleteBody: 'Your account and associated profile, preferences, cycle, daily content, Pattern, notification and consent records will be removed from active app data. App access will stop. Permanent deletion remains pending until Base44 recovery areas and provider steps are separately verified',
    cancel: 'Cancel', confirmWithdraw: 'Withdraw consent and clear data', confirmDelete: 'Request account deletion',
    loading: 'Checking status', progress: 'Processing your request', partial: 'Your request is saved. You can continue cleanup using the same request',
    withdrawn: 'Consent is withdrawn. Health data cleanup is still pending',
    cleaned: 'Consent is withdrawn and removal of active health records is verified. Your account remains active',
    platform: 'Your account and active personal app records have been removed. Permanent platform erasure and provider verification remain pending. You are signed out',
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

// Centralized localization catalog (minimal Foundation infrastructure — NOT the production translation dataset).
// Shared Foundation TR review is separate from the APPROVED_PRODUCT_COPY onboarding catalog.
export const SUPPORTED_LANGUAGES = ["en", "tr"];

export const STRINGS = Object.freeze({
  en: {
    "admin.testTools": "Test Tools", "admin.testToolsDescription": "Per-user onboarding and account tests.",
    "profile.open": "You",
    "admin.panel": "Admin Panel",
    "admin.health": "Health Center",
    "admin.build": "Build & Environment",
    "admin.healthDescription": "Health checks, tests and results.",
    "admin.buildDescription": "Current version, environment details and package history.",
    "admin.returnApp": "Back to Shinka",
    "admin.navigation": "Admin navigation",
    "admin.checking": "Checking access…",
    "admin.unavailable": "This area is not available.",
    "session.unverified": "Your session could not be verified right now. You are still signed in.",
    "session.retry": "Try again",

    "auth.title": "Welcome to Shinka", "auth.intro": "Sign in with Apple or Google",
    "auth.apple": "Continue with Apple", "auth.google": "Continue with Google",
    "auth.AUTH_PROVIDER_FAILED": "We couldn’t sign you in. Please try again",
    "auth.AUTH_SESSION_FAILED": "Please sign in again",
    "auth.AUTH_UNSUPPORTED_METHOD": "Please use Apple or Google to sign in",
    "auth.AUTH_CANCELLED": "Sign-in cancelled",
    "nav.home": "Home", "nav.calendar": "Calendar", "nav.pattern": "Pattern", "nav.you": "You",
    "nav.inactive": "Future navigation (inactive)", "nav.youUnavailable": "You (profile) — not available in this build",
    "shell.eyebrow": "Foundation build", "shell.title": "Shinka is being prepared.",
    "shell.body": "Daily content, Calendar and Pattern arrive in later packages. Nothing here is personalised yet.",
    "state.retry": "Retry",
  },
  tr: {
    "admin.testTools": "Test Araçları", "admin.testToolsDescription": "Kullanıcı bazında onboarding ve hesap testleri.",
    "profile.open": "Profil",
    "admin.panel": "Admin Panel",
    "admin.health": "Health Center",
    "admin.build": "Build & Environment",
    "admin.healthDescription": "Sağlık kontrolleri, testler ve sonuçlar.",
    "admin.buildDescription": "Güncel sürüm, ortam bilgileri ve paket geçmişi.",
    "admin.returnApp": "Uygulamaya dön",
    "admin.navigation": "Yönetim gezinmesi",
    "admin.checking": "Erişim kontrol ediliyor…",
    "admin.unavailable": "Bu alana erişilemiyor.",
    "session.unverified": "Oturum şu an doğrulanamadı. Oturumun kapatılmadı.",
    "session.retry": "Tekrar dene",

    "auth.title": "Shinka’ya hoş geldin", "auth.intro": "Apple veya Google ile giriş yap",
    "auth.apple": "Apple ile devam et", "auth.google": "Google ile devam et",
    "auth.AUTH_PROVIDER_FAILED": "Giriş yapılamadı. Lütfen tekrar dene",
    "auth.AUTH_SESSION_FAILED": "Lütfen yeniden giriş yap",
    "auth.AUTH_UNSUPPORTED_METHOD": "Giriş yapmak için Apple veya Google kullan",
    "auth.AUTH_CANCELLED": "Giriş iptal edildi",
    "nav.home": "Ana Sayfa", "nav.calendar": "Takvim", "nav.pattern": "Pattern", "nav.you": "Sen",
    "nav.inactive": "Gelecek gezinme (etkin değil)", "nav.youUnavailable": "Profil — bu sürümde kullanılamaz",
    "shell.eyebrow": "Temel sürüm", "shell.title": "Shinka hazırlanıyor.",
    "shell.body": "Günlük içerik, Takvim ve Pattern sonraki paketlerde gelecek. Burada henüz kişisel bir şey yok.",
    "state.retry": "Tekrar dene",
  },
});

// Saved product preference wins. URL/storage hints are deliberately not inputs.
export const resolveLanguage = (saved = undefined, locale = typeof navigator !== "undefined" ? navigator.language : "en") => {
  if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
  const base = String(locale || "").toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : "en";
};

export const t = (key, lang = resolveLanguage()) => STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
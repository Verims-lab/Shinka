// Centralized localization catalog (minimal Foundation infrastructure — NOT the production translation dataset).
// Shared Foundation TR review is separate from the APPROVED_PRODUCT_COPY onboarding catalog.
export const SUPPORTED_LANGUAGES = ["en", "tr"];

export const STRINGS = Object.freeze({
  en: {
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

export const resolveLanguage = () =>
  (typeof navigator !== "undefined" && /^tr/i.test(navigator.language || "") ? "tr" : "en");

export const t = (key, lang = resolveLanguage()) => STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
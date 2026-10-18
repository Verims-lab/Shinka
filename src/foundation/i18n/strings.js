// Centralized localization catalog (minimal Foundation infrastructure — NOT the production translation dataset).
// EN strings follow UI/UX v1.1 where defined; TR equivalents are PENDING_COPY_REVIEW (OD-010).
export const SUPPORTED_LANGUAGES = ["en", "tr"];

export const STRINGS = Object.freeze({
  en: {
    "nav.home": "Home", "nav.calendar": "Calendar", "nav.pattern": "Pattern", "nav.you": "You",
    "nav.inactive": "Future navigation (inactive)", "nav.youUnavailable": "You (profile) — not available in this build",
    "shell.eyebrow": "Foundation build", "shell.title": "Shinka is being prepared.",
    "shell.body": "Daily content, Calendar and Pattern arrive in later packages. Nothing here is personalised yet.",
    "state.retry": "Retry",
  },
  tr: {
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
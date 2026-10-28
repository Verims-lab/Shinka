// 045: the app-resolved, account-bound theme is the ONLY writer of `.dark`.
// The OS `prefers-color-scheme` is intentionally never read; absent = light.
export const resolveAppTheme = value => (value === 'dark' ? 'dark' : 'light');
// Last input accepted at the existing verified account/view boundary. Health
// compares this independent expectation with the DOM; it never infers it from CSS.
const accepted = new WeakMap();
export function appThemeExpectation(doc = document) {
  const value = accepted.get(doc) ?? null;
  return { theme: resolveAppTheme(value), source: value === null ? 'UNVERIFIED_DEFAULT' : 'VERIFIED_ACCOUNT_PREFERENCE' };
}
export function applyAppTheme(value, doc = document) {
  accepted.set(doc, value === 'light' || value === 'dark' ? value : null);
  const theme = resolveAppTheme(value), root = doc.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  doc.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
  return theme;
}

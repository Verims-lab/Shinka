// 045: the app-resolved, account-bound theme is the ONLY writer of `.dark`.
// The OS `prefers-color-scheme` is intentionally never read; absent = light.
export const resolveAppTheme = value => (value === 'dark' ? 'dark' : 'light');
export function applyAppTheme(value, doc = document) {
  const theme = resolveAppTheme(value), root = doc.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  doc.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
  return theme;
}
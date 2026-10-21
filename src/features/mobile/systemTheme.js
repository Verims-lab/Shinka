// One system-following theme owner; no preference storage or parallel toggle.
export function followSystemTheme(root = document.documentElement, media = matchMedia('(prefers-color-scheme: dark)')) {
  const apply = () => {
    root.classList.toggle('dark', media.matches);
    root.classList.toggle('light', !media.matches);
    root.style.colorScheme = media.matches ? 'dark' : 'light';
  };
  apply();
  media.addEventListener('change', apply);
  return () => media.removeEventListener('change', apply);
}

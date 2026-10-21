import { useLayoutEffect } from 'react';
import { followSystemTheme } from './systemTheme';
export default function SystemTheme() {
  useLayoutEffect(() => followSystemTheme(), []);
  return null;
}

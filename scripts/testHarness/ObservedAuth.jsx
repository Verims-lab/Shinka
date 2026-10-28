// CLI-only observation of the real provider used by the real App/router.
import { AuthProvider as ActualProvider, useAuth } from '../../src/lib/AuthContext';
import { createElement as h } from 'react';
export { useAuth };
function Observer() {
  const value=useAuth();
  if(['startupFixture','themeFixture'].some(key=>new URLSearchParams(location.search).has(key))) globalThis.__appAuth=value;
  return null;
}
export function AuthProvider({children,...props}) {
  return h(ActualProvider,props,h(Observer),children);
}

// CLI-only observation of the real provider used by the real App/router.
import { AuthProvider as ActualProvider, useAuth } from '../../src/lib/AuthContext';
import { createElement as h } from 'react';
export { useAuth };
function Observer() {
  const value=useAuth();
  if(new URLSearchParams(location.search).has('startupFixture')) globalThis.__appAuth=value;
  return null;
}
export function AuthProvider({children,...props}) {
  return h(ActualProvider,props,h(Observer),children);
}

import { createContext, useContext, useMemo } from 'react';

const NavigationGeometryContext = createContext(null);

// App-lifetime element references only. No identity, persistence or transport.
function createRegistry() {
  const entries = new Set(), listeners = new Set();
  const notify = () => listeners.forEach(listener => listener());
  return {
    register(elements) {
      entries.add(elements); notify();
      return () => { entries.delete(elements); notify(); };
    },
    current() {
      return Array.from(entries).find(({nav}) => nav?.isConnected && nav.getClientRects().length && getComputedStyle(nav).visibility !== 'hidden') || null;
    },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    notify,
  };
}

export function NavigationGeometryProvider({ children }) {
  const registry = useMemo(createRegistry, []);
  return <NavigationGeometryContext.Provider value={registry}>{children}</NavigationGeometryContext.Provider>;
}

export const useNavigationGeometry = () => useContext(NavigationGeometryContext);

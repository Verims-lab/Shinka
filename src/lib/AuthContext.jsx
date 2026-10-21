import { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { safeAuthError } from "@/foundation/authErrors";
import { PRIVACY_SIGNAL, privacyRecoveryStore } from '@/services/privacyService';
import { queryClientInstance } from '@/lib/query-client';

const AuthContext = createContext(null);
// Isolated canonical tests inject a client; production uses the existing SDK.
/** @param {{children?:import("react").ReactNode,client?:{app:{getPublicSettings:()=>Promise<any>},functions:{invoke:(name:string,body:object)=>Promise<any>},auth:{logout:(redirect?:string)=>void|Promise<any>}}}} props */
export const AuthProvider = ({ children, client = base44 }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isRefreshingAuth, setIsRefreshingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const generation = useRef(0), signedOut = useRef(false);
  const privacyVersion = useRef(null);

  const checkUserAuth = useCallback(async () => {
    if (signedOut.current) return false;
    const ticket = ++generation.current;
    setIsRefreshingAuth(true);
    try {
      const response = await client.functions.invoke('applicationSession', {});
      const currentUser = response?.data;
      if (currentUser?.authority !== 'BASE44_NATIVE_V1' || !['admin','user'].includes(currentUser?.role)) throw new Error('APPLICATION_SESSION_UNVERIFIED');
      if (ticket !== generation.current) return false;
      if (!currentUser?.id) throw new Error("AUTH_SESSION_REQUIRED");
      if (privacyVersion.current && privacyVersion.current !== `${currentUser.id}:${currentUser.privacyRevision || ''}`) window.dispatchEvent(new Event('shinka-health-access-changed'));
      privacyVersion.current = `${currentUser.id}:${currentUser.privacyRevision || ''}`;
      setUser(currentUser); setIsAuthenticated(true); setAuthError(null);
      return true;
    } catch (error) {
      if (ticket !== generation.current) return false;
      setUser(null); setIsAuthenticated(false);
      setAuthError({ type: "auth_required", code: safeAuthError(error, "session") });
      return false;
    } finally {
      if (ticket === generation.current) {
        setIsLoadingAuth(false); setIsRefreshingAuth(false); setAuthChecked(true);
      }
    }
  }, [client]);

  const checkAppState = useCallback(async () => {
    const ticket = ++generation.current;
    setIsLoadingPublicSettings(true);
    try {
      const settings = await client.app.getPublicSettings();
      if (ticket !== generation.current) return;
      setAppPublicSettings(settings);
    } catch (error) {
      if (ticket !== generation.current) return;
      // Preserve the platform membership boundary without surfacing its payload.
      if (error?.status === 403 && error?.data?.extra_data?.reason === "user_not_registered") {
        setUser(null); setIsAuthenticated(false); setAuthChecked(true); setIsLoadingAuth(false);
        setAuthError({ type: "user_not_registered", code: safeAuthError(error, "session") });
        return;
      }
    } finally {
      if (ticket === generation.current) setIsLoadingPublicSettings(false);
    }
    if (ticket === generation.current) await checkUserAuth();
  }, [client, checkUserAuth]);
  useEffect(() => {
    void checkAppState();
    return () => { generation.current++; };
  }, [checkAppState]);
  useEffect(() => {
    const changed = () => { queryClientInstance.clear(); };
    const external = event => {
      if (event.key !== PRIVACY_SIGNAL) return;
      window.dispatchEvent(new Event('shinka-health-access-changed'));
      void checkUserAuth();
    };
    window.addEventListener('storage', external);
    window.addEventListener('shinka-health-access-changed', changed);
    return () => { window.removeEventListener('storage', external); window.removeEventListener('shinka-health-access-changed', changed); };
  }, [checkUserAuth]);

  // Refresh privilege without unmounting the onboarding form. No push/revocation guarantee.
  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = () => { if (document.visibilityState === "visible") void checkUserAuth(); };
    const restore = event => {
      if (!event.persisted) return;
      queryClientInstance.clear(); setUser(null); setIsAuthenticated(false);
      window.dispatchEvent(new Event('shinka-health-access-changed'));
      void checkUserAuth();
    };
    window.addEventListener('pageshow', restore);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60000);
    return () => {
      window.removeEventListener('pageshow', restore);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(timer);
    };
  }, [isAuthenticated, user?.role, checkUserAuth]);

  const logout = async (shouldRedirect = true, { preservePrivacyRecovery = false } = {}) => {
    signedOut.current = true; generation.current++;
    window.dispatchEvent(new Event('shinka-session-ended'));
    queryClientInstance.clear();
    if (!preservePrivacyRecovery) privacyRecoveryStore.clear();
    setUser(null); setIsAuthenticated(false); setAuthChecked(true);
    setIsLoadingAuth(false); setIsRefreshingAuth(false); setIsLoadingPublicSettings(false);
    try { await client.auth.logout(shouldRedirect ? `${window.location.origin}/login` : undefined); }
    catch (error) { setAuthError({ type: "auth_required", code: safeAuthError(error, "session") }); }
  };
  const navigateToLogin = () => { window.location.assign(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`); };
  // One frontend authority for both the profile entry and AdminGate.
  const isAdmin = authChecked && isAuthenticated && !isLoadingPublicSettings && !isLoadingAuth && !isRefreshingAuth && !authError && user?.role === "admin";
  return <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, isLoadingAuth, isRefreshingAuth, isLoadingPublicSettings, authError,
    appPublicSettings, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AUTH_CONTEXT_REQUIRED");
  return context;
};

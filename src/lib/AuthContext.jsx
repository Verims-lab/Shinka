import { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { safeAuthError } from "@/foundation/authErrors";

const AuthContext = createContext(null);
// Isolated canonical tests inject a client; production uses the existing SDK.
/** @param {{children?:import("react").ReactNode,client?:{app:{getPublicSettings:()=>Promise<any>},auth:{me:()=>Promise<any>,logout:(redirect?:string)=>void|Promise<any>}}}} props */
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

  const checkUserAuth = useCallback(async () => {
    if (signedOut.current) return false;
    const ticket = ++generation.current;
    setIsRefreshingAuth(true);
    try {
      const currentUser = await client.auth.me();
      if (ticket !== generation.current) return false;
      if (!currentUser?.id) throw new Error("AUTH_SESSION_REQUIRED");
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

  // Refresh privilege without unmounting the onboarding form. No push/revocation guarantee.
  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = () => { if (document.visibilityState === "visible") void checkUserAuth(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = user?.role === "admin" ? setInterval(refresh, 60000) : undefined;
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(timer);
    };
  }, [isAuthenticated, user?.role, checkUserAuth]);

  const logout = async (shouldRedirect = true) => {
    signedOut.current = true; generation.current++;
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

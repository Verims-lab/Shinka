import { createContext, useState, useContext, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { safeAuthError } from "@/foundation/authErrors";

const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser); setIsAuthenticated(true); setAuthError(null);
    } catch (error) {
      setUser(null); setIsAuthenticated(false);
      setAuthError({ type: "auth_required", code: safeAuthError(error, "session") });
    } finally { setIsLoadingAuth(false); setAuthChecked(true); }
  };
  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    try { setAppPublicSettings(await base44.app.getPublicSettings()); }
    catch (error) {
      // Preserve the platform's membership boundary without surfacing its payload.
      if (error?.status === 403 && error?.data?.extra_data?.reason === "user_not_registered") {
        setUser(null); setIsAuthenticated(false); setAuthChecked(true); setIsLoadingAuth(false);
        setAuthError({ type:"user_not_registered", code:safeAuthError(error,"session") });
        return;
      }
      setAuthError({ type: "auth_required", code: safeAuthError(error, "session") });
    }
    finally { setIsLoadingPublicSettings(false); }
    await checkUserAuth();
  };
  useEffect(() => { void checkAppState(); }, []);

  const logout = async (shouldRedirect = true) => {
    try {
      await base44.auth.logout(shouldRedirect ? `${window.location.origin}/login` : undefined);
      setUser(null); setIsAuthenticated(false);
    } catch (error) { setAuthError({ type: "auth_required", code: safeAuthError(error, "session") }); }
  };
  const navigateToLogin = () => { window.location.assign(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`); };
  return <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError,
    appPublicSettings, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AUTH_CONTEXT_REQUIRED");
  return context;
};

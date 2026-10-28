import { createContext, useState, useContext, useEffect, useCallback, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { safeAuthError, classifySessionFailure, AUTH_ERROR_CODES } from "@/foundation/authErrors";
import { createSessionCoalescer, waitForSessionRetry } from "@/lib/sessionCheck";
import { PRIVACY_SIGNAL, privacyRecoveryStore } from '@/services/privacyService';
import { queryClientInstance } from '@/lib/query-client';
import { applyAppTheme } from '@/lib/appTheme';

const AuthContext = createContext(null);
const SESSION_TIMING = { now: () => Date.now(), every: (fn, ms) => window.setInterval(fn, ms), cancel: id => window.clearInterval(id) };
// Production uses the existing SDK and browser document/events. Embedded Health
// fixtures inject their own event scope and detached theme document to avoid
// changing the active account while exercising the same provider logic.
/** @param {{children?:import("react").ReactNode,themeDocument?:Document,events?:EventTarget,sessionTiming?:typeof SESSION_TIMING,sessionWait?:typeof waitForSessionRetry,client?:{app:{getPublicSettings:()=>Promise<any>},functions:{invoke:(name:string,body:object)=>Promise<any>},auth:{logout:(redirect?:string)=>void|Promise<any>}}}} props */
export const AuthProvider = ({ children, client = base44, sessionTiming = SESSION_TIMING, sessionWait = waitForSessionRetry, themeDocument = document, events = window }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isRefreshingAuth, setIsRefreshingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const generation = useRef(0), appGeneration = useRef(0), signedOut = useRef(false), refused = useRef(false);
  const privacyVersion = useRef(null);
  const retryController = useRef(null);
  useEffect(() => {
    if (!isAuthenticated || isLoadingAuth || isLoadingPublicSettings || authError) applyAppTheme(null, themeDocument);
  }, [isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, themeDocument]);

  const verifySession = useCallback(async () => {
    // A platform membership refusal stays authoritative until the next checkAppState.
    if (signedOut.current || refused.current) return false;
    const ticket = ++generation.current;
    retryController.current?.abort();
    const controller = new AbortController(); retryController.current = controller;
    setIsRefreshingAuth(true);
    try {
      // Transient (503/429/network) failures get two quiet retries before the retry screen.
      let response;
      for (let attempt = 0; ; attempt++) {
        if (controller.signal.aborted || ticket !== generation.current) return false;
        try { response = await client.functions.invoke('applicationSession', {}); break; }
        catch (error) {
          if (attempt >= 2 || classifySessionFailure(error) === "INVALID" || ticket !== generation.current) throw error;
          if (!await sessionWait(700 * (attempt + 1),controller.signal)) return false;
        }
      }
      const currentUser = response?.data;
      if (currentUser?.authority !== 'BASE44_NATIVE_V1' || !['admin','user'].includes(currentUser?.role)) throw new Error('APPLICATION_SESSION_UNVERIFIED');
      if (ticket !== generation.current) return false;
      if (!currentUser?.id) throw new Error("AUTH_SESSION_REQUIRED");
      if (privacyVersion.current && privacyVersion.current !== `${currentUser.id}:${currentUser.privacyRevision || ''}`) events.dispatchEvent(new Event('shinka-health-access-changed'));
      privacyVersion.current = `${currentUser.id}:${currentUser.privacyRevision || ''}`;
      setUser(currentUser); setIsAuthenticated(true); setAuthError(null);
      return true;
    } catch (error) {
      if (ticket !== generation.current) return false;
      if (classifySessionFailure(error) === "INVALID") {
        events.dispatchEvent(new Event('shinka-session-ended'));
        setUser(null); setIsAuthenticated(false);
        setAuthError({ type: "auth_required", code: safeAuthError(error, "session") });
      } else {
        // Transient: no logout or login redirect. authError blocks isAdmin, so a
        // previously seen role grants no new admin operation until re-verified.
        setAuthError({ type: "session_unverified", code: AUTH_ERROR_CODES.SESSION_FAILED });
      }
      return false;
    } finally {
      controller.abort();
      if (retryController.current === controller) retryController.current = null;
      if (ticket === generation.current) {
        setIsLoadingAuth(false); setIsRefreshingAuth(false); setAuthChecked(true);
      }
    }
  }, [client, sessionWait, events]);
  const coalescer = useMemo(() => createSessionCoalescer(verifySession, { now: sessionTiming.now }), [verifySession, sessionTiming]);
  const checkUserAuth = coalescer.check;

  const checkAppState = useCallback(async () => {
    const ticket = ++generation.current;
    retryController.current?.abort();
    coalescer.reset(); signedOut.current = false; refused.current = false;
    setUser(null); setIsAuthenticated(false); setAuthChecked(false); setAuthError(null);
    setIsLoadingAuth(true); setIsRefreshingAuth(false);
    events.dispatchEvent(new Event('shinka-health-access-changed'));
    setIsLoadingPublicSettings(true);
    // Settings and session verification are independent reads: run them in
    // parallel. App renders nothing until both settle; a membership refusal
    // cancels (generation bump) any session result that arrived first.
    const appTicket = ++appGeneration.current;
    const session = ticket === generation.current ? checkUserAuth() : Promise.resolve(false);
    try {
      const settings = await client.app.getPublicSettings();
      if (appTicket !== appGeneration.current) return;
      setAppPublicSettings(settings);
    } catch (error) {
      if (appTicket !== appGeneration.current) return;
      // Preserve the platform membership boundary without surfacing its payload.
      if (error?.status === 403 && error?.data?.extra_data?.reason === "user_not_registered") {
        refused.current = true; generation.current++; coalescer.reset();
        retryController.current?.abort();
        setUser(null); setIsAuthenticated(false); setAuthChecked(true); setIsLoadingAuth(false); setIsRefreshingAuth(false);
        setAuthError({ type: "user_not_registered", code: safeAuthError(error, "session") });
        return;
      }
    } finally {
      if (appTicket === appGeneration.current) setIsLoadingPublicSettings(false);
    }
    await session;
  }, [client, checkUserAuth, coalescer, events]);
  useEffect(() => {
    void checkAppState();
    return () => { generation.current++; appGeneration.current++; retryController.current?.abort(); coalescer.reset(); };
  }, [checkAppState, coalescer]);
  useEffect(() => {
    const changed = () => { queryClientInstance.clear(); applyAppTheme(null, themeDocument); };
    const ended = () => applyAppTheme(null, themeDocument);
    events.addEventListener('shinka-session-ended', ended);
    const external = event => {
      if (event.key !== PRIVACY_SIGNAL) return;
      events.dispatchEvent(new Event('shinka-health-access-changed'));
      void checkUserAuth();
    };
    events.addEventListener('storage', external);
    events.addEventListener('shinka-health-access-changed', changed);
    return () => { events.removeEventListener('storage', external); events.removeEventListener('shinka-health-access-changed', changed); events.removeEventListener('shinka-session-ended', ended); };
  }, [checkUserAuth, events, themeDocument]);

  // Refresh privilege without unmounting the onboarding form. No push/revocation guarantee.
  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = () => { if (document.visibilityState === "visible") void coalescer.passive(); };
    const restore = event => {
      if (!event.persisted) return;
      // Loading (not logged-out) while re-verifying, so routes never flash login.
      generation.current++; queryClientInstance.clear(); setUser(null); setIsAuthenticated(false); setIsLoadingAuth(true); coalescer.reset();
      retryController.current?.abort();
      events.dispatchEvent(new Event('shinka-health-access-changed'));
      void checkUserAuth();
    };
    events.addEventListener('pageshow', restore);
    events.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = sessionTiming.every(refresh, 60000);
    return () => {
      events.removeEventListener('pageshow', restore);
      events.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      sessionTiming.cancel(timer);
    };
  }, [isAuthenticated, user?.role, checkUserAuth, coalescer, sessionTiming, events]);

  const logout = async (shouldRedirect = true, { preservePrivacyRecovery = false } = {}) => {
    signedOut.current = true; generation.current++; appGeneration.current++; coalescer.reset();
    retryController.current?.abort();
    events.dispatchEvent(new Event('shinka-session-ended'));
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

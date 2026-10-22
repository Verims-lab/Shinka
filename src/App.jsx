import SystemTheme from "@/features/mobile/SystemThemeBinding";
import RouteMotion from "@/features/mobile/RouteMotion";
import { lazy } from "react";
import RouteBoundary from "@/components/RouteBoundary";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
// Add page imports here
import ProductRoute from "@/components/ProductRoute";
import AdminGate from "@/components/internal/AdminGate";
const TestTools = lazy(() => import("@/pages/internal/TestTools"));
const AccountPrivacy = lazy(() => import("@/pages/AccountPrivacy"));
const AdminPanel = lazy(() => import("@/pages/internal/AdminPanel"));
const BuildEnvironment = lazy(
  () => import("@/pages/internal/BuildEnvironment"),
);
const HealthCenter = lazy(() => import("@/pages/internal/HealthCenter"));
const AuthShellProbe = lazy(() => import("@/foundation/probes/AuthShellProbe"));
import { isAuthProbePath } from "@/foundation/probes/authProbeRoute";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered" && !['/account-privacy','/delete-account'].includes(window.location.pathname)) {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <Routes>
      <Route path="/account-privacy" element={<RouteBoundary><AccountPrivacy /></RouteBoundary>} />
      <Route path="/delete-account" element={<RouteBoundary><AccountPrivacy /></RouteBoundary>} />
      <Route
        path="/login"
        element={<ProductRoute publicEntry initialEntry="UNAUTHENTICATED_SIGN_IN" />}
      />
      <Route path="/" element={<ProductRoute publicEntry />} />
      <Route path="/onboarding" element={<ProductRoute publicEntry />} />
      <Route path="/you" element={<ProductRoute destination="you" />} />
      <Route path="/pattern" element={<ProductRoute destination="pattern" />} />
      <Route path="/calendar" element={<ProductRoute destination="calendar" />} />
      <Route
        element={
          <ProtectedRoute
            unauthenticatedElement={<Navigate to="/login" replace />}
          />
        }
      >
        <Route element={<AdminGate />}>
          <Route path="/internal/test-tools" element={<RouteBoundary><TestTools /></RouteBoundary>} />
          <Route path="/internal" element={<RouteBoundary><AdminPanel /></RouteBoundary>} />
          <Route
            path="/internal/build"
            element={
              <RouteBoundary>
                <BuildEnvironment />
              </RouteBoundary>
            }
          />
          <Route
            path="/internal/health"
            element={
              <RouteBoundary>
                <HealthCenter />
              </RouteBoundary>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  if (isAuthProbePath(window.location.pathname))
    return (
      <RouteBoundary>
        <AuthShellProbe />
      </RouteBoundary>
    );
  return (
    <>
    <SystemTheme />
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <RouteMotion><AuthenticatedApp /></RouteMotion>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
    </>
  );
}

export default App;

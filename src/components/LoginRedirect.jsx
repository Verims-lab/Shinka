import { Navigate, useLocation } from "react-router-dom";

// Protected destinations keep their path so sign-in returns there once
// (validated again by safeReturnTo), instead of landing on "/" and re-prompting.
export default function LoginRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`/login?returnTo=${encodeURIComponent(pathname + search)}`} replace />;
}
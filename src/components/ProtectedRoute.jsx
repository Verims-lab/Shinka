import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SessionRetry from '@/components/SessionRetry';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement, children = undefined }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'lifecycle_restricted') return <Navigate to="/account-privacy" replace/>;
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // Transient: keep an already verified session mounted (server re-admits each
    // call); without one, offer retry instead of sign-in buttons.
    if (authError.type === 'session_unverified') {
      return isAuthenticated ? (children || <Outlet />) : <SessionRetry />;
    }
    return unauthenticatedElement;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  return children || <Outlet />;
}
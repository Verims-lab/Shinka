import { Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Onboarding from '@/pages/Onboarding';

// Keep the same guarded resolver mounted across product destinations. Its
// snapshot belongs to this React lifetime/owner, never a cross-session cache.
// Destination reads still go through fresh server auth/lifecycle admission.
export default function ProductRoute({ destination = 'home', initialEntry = 'UNAUTHENTICATED_INTRO', publicEntry = false }) {
  return <ProtectedRoute unauthenticatedElement={publicEntry
    ? <Onboarding initialEntry={initialEntry}/>
    : <Navigate to="/login" replace/>}>
    <Onboarding destination={destination} initialEntry={initialEntry}/>
  </ProtectedRoute>;
}

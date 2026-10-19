import OnboardingScreen from '@/features/onboarding/OnboardingScreen';
import { resolveLanguage } from '@/foundation/i18n/strings';
export default function Login(){return <OnboardingScreen state="UNAUTHENTICATED_SIGN_IN" initialLanguage={resolveLanguage()}/>;}

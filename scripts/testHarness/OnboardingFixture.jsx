import Fixture from '@/foundation/tests/OnboardingTestScreen';
export default function OnboardingFixture(){const params=new URLSearchParams(location.search);return <Fixture step={params.get('step')||undefined} language={params.get('language')||'en'}/>;}

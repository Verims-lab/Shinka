// 028: GeoNames rate-limit copy and safe client mapping (in-app synthetic; no network).
import { check } from './dataModelTests';
import { ONBOARDING_ERROR_KEYS, onboardingCopy } from '../i18n/onboardingCopy';
import { onboardingRequest } from '@/services/onboardingService';

export const SECURITY_028_UI_TESTS = [
  ['SC06', 'Rate-limit code maps to approved TR/EN copy; raw backend detail never surfaces', async () => {
    check(ONBOARDING_ERROR_KEYS.includes('GEONAMES_RATE_LIMITED'));
    const tr = onboardingCopy('GEONAMES_RATE_LIMITED', 'tr'), en = onboardingCopy('GEONAMES_RATE_LIMITED', 'en');
    check(tr !== 'COPY_KEY_MISSING' && en !== 'COPY_KEY_MISSING' && tr !== en && !/429|GEONAMES/.test(tr + en));
    const client = { functions: { invoke: async () => ({ data: { error_code: 'GEONAMES_RATE_LIMITED', field: 'birthplace', retry_after_seconds: 30, detail: 'upstream secret detail' } }) } };
    let error; try { await onboardingRequest('listPlaceCountries', { language_code: 'tr' }, client); } catch (e) { error = e; }
    check(error?.code === 'GEONAMES_RATE_LIMITED' && error.field === 'birthplace' && !String(error.message).includes('upstream'));
  }],
];
// 028: GeoNames rate-limit copy, client mapping and state preservation (in-app synthetic; no network).
import { check } from './dataModelTests';
import { ONBOARDING_ERROR_KEYS, onboardingCopy } from '../i18n/onboardingCopy';
import { onboardingRequest } from '@/services/onboardingService';
import { youRequest } from '@/services/youService';
import { createBirthplacePicker } from '@/features/profile/birthplaceSelection';
import { createYouController } from '@/features/you/youController';

const limited = () => Object.assign(new Error('GEONAMES_RATE_LIMITED'), { code: 'GEONAMES_RATE_LIMITED', field: 'birthplace', unknown: false });
const settle = () => new Promise(resolve => setTimeout(resolve, 30));
const limitedClient = { functions: { invoke: async () => ({ data: { error_code: 'GEONAMES_RATE_LIMITED', field: 'birthplace', retry_after_seconds: 30, detail: 'upstream secret detail' } }) } };

export const SECURITY_028_UI_TESTS = [
  ['SC06', 'Rate-limit code maps to approved TR/EN copy in onboarding and You services; raw backend detail never surfaces', async () => {
    check(ONBOARDING_ERROR_KEYS.includes('GEONAMES_RATE_LIMITED'));
    const tr = onboardingCopy('GEONAMES_RATE_LIMITED', 'tr'), en = onboardingCopy('GEONAMES_RATE_LIMITED', 'en');
    check(tr !== 'COPY_KEY_MISSING' && en !== 'COPY_KEY_MISSING' && tr !== en && !/429|GEONAMES/.test(tr + en));
    let error; try { await onboardingRequest('listPlaceCountries', { language_code: 'tr' }, limitedClient); } catch (e) { error = e; }
    check(error?.code === 'GEONAMES_RATE_LIMITED' && error.field === 'birthplace' && !String(error.message).includes('upstream'));
    let you; try { await youRequest('saveProfile', {}, limitedClient); } catch (e) { you = e; }
    check(you?.code === 'GEONAMES_RATE_LIMITED' && you.field === 'birthplace' && you.unknown === false && !String(you.message).includes('upstream'));
  }],
  ['SC10', 'Birthplace picker keeps the chosen country on a rate limit, makes no automatic retry, and retries once only on request', async () => {
    let calls = 0;
    const request = async action => { calls++; if (action === 'listPlaceCountries') return { options: [{ id: 'TR', country: 'TR', label: 'Türkiye' }] }; throw limited(); };
    const picker = createBirthplacePicker({ request });
    await picker.start('tr'); await picker.country('TR');
    const s = picker.getSnapshot(), after = calls;
    check(s.country?.id === 'TR' && s.regions[0].status === 'ERROR' && s.regions[0].error === 'GEONAMES_RATE_LIMITED' && s.places.error === 'GEONAMES_RATE_LIMITED');
    await settle(); check(calls === after);
    await picker.retry('0'); check(calls === after + 1 && picker.getSnapshot().country?.id === 'TR');
    picker.dispose();
  }],
  ['SC11', 'You profile draft survives a rate-limited save; no automatic resend; save is definite (not unconfirmed)', async () => {
    const profile = { display_name: 'Ada', birth_date: '1990-01-01', birth_time: '10:00', birthplace_geonames_id: null, revision: 'r' };
    let saves = 0;
    const request = async action => { if (action === 'read') return { profile, preferences: { language_code: 'tr', revision: 'p' }, today: '2026-10-22' }; saves++; throw limited(); };
    const you = createYouController(request);
    await you.load(); you.edit(); you.change('display_name', 'Deniz'); await you.saveProfile();
    const s = you.getSnapshot();
    check(s.error?.code === 'GEONAMES_RATE_LIMITED' && !s.error.unknown && s.editing && s.draft?.display_name === 'Deniz' && saves === 1);
    await settle(); check(saves === 1);
    you.dispose();
  }],
];
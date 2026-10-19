import { isCalendarDate, OnboardingError } from './onboardingValidation.js';
// Approved current onboarding package product decision: fixed tropical dates, birth_date only.
// Inclusive upper bounds in MMDD order; Capricorn crosses the year boundary.
const ENDS=Object.freeze([
  [119,'CAPRICORN'],[218,'AQUARIUS'],[320,'PISCES'],[419,'ARIES'],
  [520,'TAURUS'],[620,'GEMINI'],[722,'CANCER'],[822,'LEO'],
  [922,'VIRGO'],[1022,'LIBRA'],[1121,'SCORPIO'],[1221,'SAGITTARIUS'],
]);
export function resolveSunSign(birthDate) {
  if(!isCalendarDate(birthDate))throw new OnboardingError('DATE_INVALID','birth_date');
  const day=Number(birthDate.slice(5,7))*100+Number(birthDate.slice(8,10));
  return ENDS.find(([end])=>day<=Number(end))?.[1]??'CAPRICORN';
}

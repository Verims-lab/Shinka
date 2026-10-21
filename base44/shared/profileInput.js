import { SUN_SIGN_CODES } from './domainSchemas.js';
import { SUN_SIGN_RESOLVER } from './onboardingDependencies.js';
import { optionalName, optionalBirthTime, validateBirthDate, emptyBirthplace, BIRTHPLACE_FIELDS, OnboardingError } from './onboardingValidation.js';

// Onboarding and You share one input/derived-data authority. A saved place can
// remain intact when editing unrelated fields; a changed ID always resolves again.
export async function prepareProfileInput(body, { today, geoNames, sunSign = SUN_SIGN_RESOLVER, preservedPlace = null }) {
  const birth_date = validateBirthDate(body.birth_date, today);
  const birth_time = optionalBirthTime(body.birth_time), display_name = optionalName(body.display_name);
  const sun_sign_code = typeof sunSign === 'function' ? await sunSign(birth_date) : null;
  if (sun_sign_code !== null && !SUN_SIGN_CODES.includes(String(sun_sign_code))) throw new OnboardingError('SUN_SIGN_RESOLVER_INVALID', null, 503);
  let birthplace = emptyBirthplace();
  if (body.birthplace_geonames_id != null) {
    if (preservedPlace?.birthplace_geonames_id === body.birthplace_geonames_id) {
      birthplace = Object.fromEntries(BIRTHPLACE_FIELDS.map(key => [key, preservedPlace[key]]));
    } else {
      if (!geoNames) throw new OnboardingError('GEONAMES_UNAVAILABLE', 'birthplace', 503);
      birthplace = await geoNames.resolve(body.birthplace_geonames_id);
    }
  }
  return { display_name, birth_date, birth_time, ...birthplace, sun_sign_code };
}

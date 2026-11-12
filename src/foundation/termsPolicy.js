// Small admission predicate shared by the eager router and lazy legal UI.
// Only server responses are passed here; browser intents cannot grant access.
export const TERMS_URL = 'https://shinkadaily.com/terms/';
export const PRIVACY_URL = 'https://shinkadaily.com/privacy/';
export const validTermsVersion = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(value);
export const currentTerms = value => value?.state === 'CURRENT' && validTermsVersion(value.version) && typeof value.acceptance?.id === 'string' && value.acceptance.status === 'ACCEPTED' && typeof value.acceptance.acceptedAt === 'string' && /Z$/.test(value.acceptance.acceptedAt) && Number.isFinite(Date.parse(value.acceptance.acceptedAt));

import { OnboardingError } from './onboardingValidation.js';

const FAILURE_STATUS = {
  GEONAMES_SECRET_MISSING: 503,
  GEONAMES_REQUEST_TIMEOUT: 504,
  GEONAMES_NETWORK_ERROR: 503,
  GEONAMES_HTTP_ERROR: 502,
  GEONAMES_PROVIDER_REJECTED: 502,
  GEONAMES_INVALID_RESPONSE: 502,
};
const PROVIDER_CLASSES = {
  10: 'AUTHORIZATION', 11: 'NOT_FOUND', 12: 'SERVICE', 13: 'SERVICE',
  14: 'REQUEST', 15: 'NOT_FOUND', 16: 'SERVICE', 17: 'NOT_FOUND',
  18: 'QUOTA', 19: 'QUOTA', 20: 'QUOTA', 21: 'REQUEST', 22: 'SERVICE',
  23: 'SERVICE', 24: 'REQUEST', 27: 'REQUEST',
};

// Never retain the provider URL, message, body, query, username or original error.
export class GeoNamesError extends OnboardingError {
  constructor(diagnosticCode, httpStatus=null, providerStatus=null) {
    super('GEONAMES_UNAVAILABLE',null,Object.hasOwn(FAILURE_STATUS,diagnosticCode)?FAILURE_STATUS[diagnosticCode]:502);
    this.diagnosticCode=diagnosticCode;
    this.httpStatus=httpStatus;
    this.providerStatus=providerStatus;
  }
}

// Construct an allowlisted response; never serialize an Error or its properties wholesale.
export function geoNamesDiagnostic(error) {
  if(!(error instanceof GeoNamesError))return null;
  const providerStatus=Number.isInteger(error.providerStatus)&&Object.hasOwn(PROVIDER_CLASSES,error.providerStatus)?error.providerStatus:null;
  return {
    code:Object.hasOwn(FAILURE_STATUS,error.diagnosticCode)?error.diagnosticCode:'GEONAMES_INVALID_RESPONSE',
    http_status:Number.isInteger(error.httpStatus)&&error.httpStatus>=100&&error.httpStatus<=599?error.httpStatus:null,
    provider_status:providerStatus,
    provider_class:providerStatus===null?null:PROVIDER_CLASSES[providerStatus],
  };
}

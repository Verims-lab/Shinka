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
const FAILURE_STAGES=['CONFIGURATION','FETCH','RESPONSE_BODY','RESPONSE_VALIDATION','UNKNOWN'];
const TRANSPORT_CLASSES=['DNS','TLS_CERTIFICATE','CONNECTION','REDIRECT_REJECTION','INVOCATION_INPUT','TIMEOUT','UNKNOWN'];
const TRANSPORT_CODES={
  ENOTFOUND:'DNS', EAI_AGAIN:'DNS',
  CERT_HAS_EXPIRED:'TLS_CERTIFICATE', CERT_NOT_YET_VALID:'TLS_CERTIFICATE',
  DEPTH_ZERO_SELF_SIGNED_CERT:'TLS_CERTIFICATE', SELF_SIGNED_CERT_IN_CHAIN:'TLS_CERTIFICATE',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE:'TLS_CERTIFICATE', UNABLE_TO_GET_ISSUER_CERT_LOCALLY:'TLS_CERTIFICATE',
  ERR_TLS_CERT_ALTNAME_INVALID:'TLS_CERTIFICATE',
  ECONNREFUSED:'CONNECTION', ECONNRESET:'CONNECTION', ECONNABORTED:'CONNECTION',
  ENETUNREACH:'CONNECTION', EHOSTUNREACH:'CONNECTION', EPIPE:'CONNECTION',
  ERR_INVALID_URL:'INVOCATION_INPUT', ERR_INVALID_ARG_TYPE:'INVOCATION_INPUT', ERR_INVALID_THIS:'INVOCATION_INPUT',
  ETIMEDOUT:'TIMEOUT', UND_ERR_CONNECT_TIMEOUT:'TIMEOUT', UND_ERR_HEADERS_TIMEOUT:'TIMEOUT', UND_ERR_BODY_TIMEOUT:'TIMEOUT',
};
const TRANSPORT_NAMES={
  ConnectionRefused:'CONNECTION', ConnectionReset:'CONNECTION', ConnectionAborted:'CONNECTION', NetworkUnreachable:'CONNECTION',
  TimedOut:'TIMEOUT', TimeoutError:'TIMEOUT',
};

// Inspect only transiently. No Error, cause, name, code or message leaves this helper.
// Unknown/contradictory signatures stay UNKNOWN; TypeError alone proves no cause.
export function classifyGeoNamesTransport(error) {
  const classes=new Set(),seen=new Set();
  try {
    for(let current=error,depth=0;current&&typeof current==='object'&&!seen.has(current)&&depth<4;current=current.cause,depth++){
      seen.add(current);
      const {code,name,message}=current;
      if(typeof code==='string'&&Object.hasOwn(TRANSPORT_CODES,code))classes.add(TRANSPORT_CODES[code]);
      if(typeof name==='string'&&Object.hasOwn(TRANSPORT_NAMES,name))classes.add(TRANSPORT_NAMES[name]);
      // Exact Deno / Undici redirect-policy signatures; never broad keyword matching.
      if(message==="Fetch failed: Encountered redirect while redirect mode is set to 'error'"||message==='unexpected redirect')classes.add('REDIRECT_REJECTION');
      // Deno's documented fetch-test signature. Ignore the URL/details and emit only DNS.
      if(typeof message==='string'&&message.length<=4096&&/^(?:error sending request for url \([^\r\n]*\): )?client error \(Connect\): dns error: /.test(message))classes.add('DNS');
    }
  }catch{return 'UNKNOWN';}
  return classes.size===1?[...classes][0]:'UNKNOWN';
}

// Never retain the provider URL, message, body, query, username or original error.
export class GeoNamesError extends OnboardingError {
  constructor(diagnosticCode, httpStatus=null, providerStatus=null, failureStage='UNKNOWN', transportClass=null) {
    super('GEONAMES_UNAVAILABLE',null,Object.hasOwn(FAILURE_STATUS,diagnosticCode)?FAILURE_STATUS[diagnosticCode]:502);
    this.diagnosticCode=diagnosticCode;
    this.httpStatus=httpStatus;
    this.providerStatus=providerStatus;
    this.failureStage=FAILURE_STAGES.includes(failureStage)?failureStage:'UNKNOWN';
    this.transportClass=TRANSPORT_CLASSES.includes(transportClass)?transportClass:null;
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
    failure_stage:FAILURE_STAGES.includes(error.failureStage)?error.failureStage:'UNKNOWN',
    transport_class:TRANSPORT_CLASSES.includes(error.transportClass)?error.transportClass:null,
  };
}

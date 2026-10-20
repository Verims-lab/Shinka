import {InternalError} from '../internalAuthorization.js';
import {OnboardingError} from '../onboardingValidation.js';
import {geoNamesDiagnostic} from '../geonamesDiagnostics.js';

// Only bounded domain codes cross HTTP. Driver messages can include SQL/data.
export async function handleSqlRequest(req,route,open,options={}) {
  let connection;
  try {
    if(req.method!=='POST')throw new InternalError('METHOD_NOT_ALLOWED',405);
    const text=await req.text();
    if(new TextEncoder().encode(text).length>1000000)throw new InternalError('REQUEST_TOO_LARGE',413);
    let body;try{body=JSON.parse(text||'{}');}catch{throw new InternalError('INVALID_REQUEST',400);}
    connection=await open(req,options);
    return Response.json(await connection.runtime.execute(route,body));
  } catch(error) {
    const known=error instanceof InternalError,diagnostic=route==='onboarding'?geoNamesDiagnostic(error):null;
    return Response.json({error_code:known?error.code:'SQL_OPERATION_FAILED',
      ...(route==='onboarding'?{field:error instanceof OnboardingError?error.field:null}:{}),...(diagnostic?{diagnostic}:{})},
      {status:known?error.status:503});
  } finally {if(connection)await connection.close().catch(()=>{});}
}

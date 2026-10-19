// CLI-only dependency injection. This file is not imported by the application build.
export const base44 = {
  app: {getPublicSettings:async()=>({})},
  auth: {
    me:async()=>{if(new URLSearchParams(location.search).get('sdkSession')==='admin')return {id:'synthetic-admin',role:'admin'};throw new Error('SYNTHETIC_ANONYMOUS');},
    loginWithProvider: async () => { throw new Error("SYNTHETIC_AUTH_NO_REDIRECT"); }
  },
  functions: { invoke: async (name, body) => {
    if(name==='onboarding'&&body.action==='hydrate'&&new URLSearchParams(location.search).get('sdkSession')==='admin')return {data:{state:'AUTHENTICATED_PROFILE_REQUIRED',preferences:{language_code:'en',timezone:'UTC'},today:'2026-10-19'}};
    if (body.action === "list") return {data:{runs:[]}};
    throw new Error("LIVE_OPERATION_UNAVAILABLE_IN_CLI");
  } },
};

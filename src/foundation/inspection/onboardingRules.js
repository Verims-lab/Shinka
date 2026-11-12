import { syntaxNodes } from './sourceRules.js';
// Build-time inspection returns a boolean, never backend source or environment values.
export function inspectGeoNamesEntry(code) {
  const nodes=syntaxNodes(code);
  const handler=nodes.find(n=>n.type==='ExportDefaultDeclaration')?.declaration;
  if(handler?.type!=='FunctionDeclaration')return false;
  const inside=n=>n.start>handler.body.start&&n.end<handler.body.end;
  const factory=nodes.find(n=>inside(n)&&n.type==='VariableDeclarator'&&n.id?.name==='geoNamesFor')?.init;
  if(!factory)return false;
  const within=n=>n.start>=factory.start&&n.end<=factory.end;
  const guarded=nodes.some(n=>within(n)&&n.type==='CallExpression'&&n.callee?.object?.name==='guard'&&n.callee?.property?.name==='forOwner');
  const adapter=nodes.find(n=>within(n)&&n.type==='CallExpression'&&n.callee?.name==='createGeoNamesAdapter');
  const secret=adapter?.arguments?.[0]?.properties?.find(p=>p.key?.name==='username')?.value;
  const reads=nodes.filter(n=>n.type==='CallExpression'&&n.callee?.object?.name==='secrets'&&n.callee?.property?.name==='get');
  const imports=(src,name)=>nodes.some(n=>n.type==='ImportDeclaration'&&n.source.value===src&&n.specifiers.some(s=>(s.imported?.name||s.local?.name)===name));
  return guarded&&secret?.type==='CallExpression'&&reads.length===1&&reads[0]===secret
    && secret.arguments?.length===1&&secret.arguments[0]?.value==='GEONAMES_USERNAME'
    && imports('base44:runtime','secrets')&&imports('../../shared/geonamesAdapter.js','createGeoNamesAdapter')&&imports('../../shared/geonamesGuard.js','createGeoNamesGuard')
    && nodes.some(n=>inside(n)&&n.type==='CallExpression'&&n.callee?.name==='handleOnboardingRequest'
      && n.arguments?.[2]?.properties?.some(p=>p.key?.name==='geoNamesFor'&&p.value?.name==='geoNamesFor'));
}
export function inspectOnboardingSurface(sources,approvedCopy) {
  const duplicates=[],credentials=[];
  for(const [file,code] of Object.entries(sources)){
    if(!file.startsWith('/src/features/onboarding/')&&!['/src/pages/Onboarding.jsx','/src/services/onboardingService.js'].includes(file))continue;
    for(const node of syntaxNodes(code))if((node.type==='Literal'||node.type==='JSXText')&&typeof node.value==='string'&&approvedCopy.includes(node.value.trim()))duplicates.push({file});
    if(/GEONAMES_USERNAME|(?:api|secure)\.geonames\.org|navigator\.geolocation/.test(code))credentials.push({file});
  }
  return {ok:duplicates.length===0&&credentials.length===0,duplicateCopyFiles:duplicates.map(r=>r.file),unsafeProviderFiles:credentials.map(r=>r.file),signIn:inspectSignInControls(sources)};
}
// ON-02 contract: the anonymous Welcome always renders the 18+ declaration and both approved
// providers. The declaration gates auth and the shared logo clearance replaces the empty artwork slot.
export function inspectSignInControls(sources) {
  const screen=sources['/src/features/onboarding/OnboardingScreen.jsx']||'';
  const signIn=sources['/src/features/onboarding/SignIn.jsx']||'';
  const controls={
    anonymousBranch: /anonymousSignIn = state === "UNAUTHENTICATED_SIGN_IN"/.test(screen)
      && /if \(!screen \|\| anonymous === authenticated\) return null/.test(screen)
      && /if \(anonymousSignIn\)\s*return <SignIn\b/.test(screen),
    ageDeclaration: /id="age-declaration"/.test(signIn) && /type="checkbox"/.test(signIn),
    appleProvider: /data-provider="apple"/.test(signIn),
    googleProvider: /data-provider="google"/.test(signIn),
    ageGateBeforeAuth: /authenticate\(provider,[^)]*checked\)/.test(signIn) && /ageConfirmed !== true/.test(sources['/src/services/authService.js']||''),
    artworkSpacerAbsent: !screen.includes('shinka-onboarding-art-space'),
  };
  return { ...controls, ok: Object.values(controls).every(Boolean) };
}

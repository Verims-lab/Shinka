import { syntaxNodes } from './sourceRules.js';
// Build-time inspection returns a boolean, never backend source or environment values.
export function inspectGeoNamesEntry(code) {
  const nodes=syntaxNodes(code);
  const adapter=nodes.find(n=>n.type==='VariableDeclarator'&&n.id?.name==='geoNames')?.init;
  const secret=adapter?.arguments?.[0]?.properties?.find(p=>p.key?.name==='username')?.value;
  return adapter?.callee?.name==='createGeoNamesAdapter'
    && secret?.type==='CallExpression'&&secret.callee?.object?.object?.name==='Deno'
    && secret.callee?.object?.property?.name==='env'&&secret.callee?.property?.name==='get'
    && secret.arguments?.length===1&&secret.arguments[0]?.value==='GEONAMES_USERNAME'
    && nodes.some(n=>n.type==='ImportDeclaration'&&n.source.value==='../../shared/geonamesAdapter.js')
    && nodes.some(n=>n.type==='CallExpression'&&n.callee?.name==='handleOnboardingRequest'
      && n.arguments?.[2]?.properties?.some(p=>p.key?.name==='geoNames'&&p.value?.name==='geoNames'));
}
export function inspectOnboardingSurface(sources,approvedCopy) {
  const duplicates=[],credentials=[];
  for(const [file,code] of Object.entries(sources)){
    if(!file.startsWith('/src/features/onboarding/')&&!['/src/pages/Onboarding.jsx','/src/services/onboardingService.js'].includes(file))continue;
    for(const node of syntaxNodes(code))if((node.type==='Literal'||node.type==='JSXText')&&typeof node.value==='string'&&approvedCopy.includes(node.value.trim()))duplicates.push({file});
    if(/GEONAMES_USERNAME|(?:api|secure)\.geonames\.org|navigator\.geolocation/.test(code))credentials.push({file});
  }
  return {ok:duplicates.length===0&&credentials.length===0,duplicateCopyFiles:duplicates.map(r=>r.file),unsafeProviderFiles:credentials.map(r=>r.file)};
}

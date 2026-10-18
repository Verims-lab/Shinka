import { syntaxNodes } from './sourceRules.js';
export function inspectOnboardingSurface(sources,approvedCopy) {
  const duplicates=[],credentials=[];
  for(const [file,code] of Object.entries(sources)){
    if(!file.startsWith('/src/features/onboarding/')&&!['/src/pages/Onboarding.jsx','/src/services/onboardingService.js'].includes(file))continue;
    for(const node of syntaxNodes(code))if((node.type==='Literal'||node.type==='JSXText')&&typeof node.value==='string'&&approvedCopy.includes(node.value.trim()))duplicates.push({file});
    if(/GEONAMES_USERNAME|api\.geonames\.org|navigator\.geolocation/.test(code))credentials.push({file});
  }
  return {ok:duplicates.length===0&&credentials.length===0,duplicateCopyFiles:duplicates.map(r=>r.file),unsafeProviderFiles:credentials.map(r=>r.file)};
}

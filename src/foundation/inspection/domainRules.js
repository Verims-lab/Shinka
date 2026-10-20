import { syntaxNodes } from './sourceRules.js';
// Repository import/seed tripwire. Fixtures are isolated in the canonical test tree;
// ordinary application/backend/scripts stay in scope. This is not a live row count.
export function inspectProductWriteSurface(sources) {
  const allowed={'/base44/shared/nativeDailyPersistence.js':1,'/base44/shared/nativeCalendarPersistence.js':2,'/base44/shared/nativeCalendarGrant.js':3,'/base44/shared/nativeTestJournal.js':2,'/base44/shared/nativeResetStep.js':1,'/base44/shared/domainAudit.js':2,'/base44/shared/internalHealthOperations.js':1,'/base44/shared/base44OnboardingAdapter.js':2,'/base44/shared/base44ContentLibrary.js':1,'/base44/shared/moonImport.js':1};
  const methods={'/base44/shared/base44OnboardingAdapter.js':['upsert','create'],'/base44/shared/base44ContentLibrary.js':['upsert'],'/base44/shared/moonImport.js':['upsert']};
  const writes=[];
  for(const [file,code] of Object.entries(sources)) {
    if(file.startsWith('/src/foundation/tests/')) continue;
    for(const node of syntaxNodes(code)) {
      if(node.type!=='CallExpression'||node.callee?.type!=='MemberExpression') continue;
      const name=node.callee.computed?node.callee.property?.value:node.callee.property?.name;
      if(['create','bulkCreate','upsert','importEntities'].includes(name)) writes.push({file,operation:name});
    }
  }
  const unexpected=writes.filter(w=>!Object.hasOwn(allowed,w.file)||!(methods[w.file]||['create']).includes(w.operation));
  const changedAllowlistedCounts=Object.entries(allowed).filter(([file,count])=>writes.filter(w=>w.file===file).length!==count).map(([file])=>file);
  const onboardingWriteCalls=writes.filter(w=>w.file==='/base44/shared/base44OnboardingAdapter.js').length;
  return {ok:unexpected.length===0&&changedAllowlistedCounts.length===0,unexpected,changedAllowlistedCounts,metadataWriteCalls:writes.length-onboardingWriteCalls,onboardingWriteCalls,scope:'STATIC_IMPORT_SEED_CALL_INSPECTION'};
}

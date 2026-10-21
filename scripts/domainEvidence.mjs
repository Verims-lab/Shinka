import fs from 'node:fs';
import path from 'node:path';
import { DOMAIN_SCHEMAS, physicalName, base44Schema } from '../base44/shared/domainSchemas.js';
import { ACCESS_MATRIX } from '../base44/shared/domainSecurity.js';
export function inspectDomainSchemas(root) {
  const dir=path.join(root,'base44/entities');
  const files=fs.readdirSync(dir).filter(f=>/\.jsonc?$/.test(f));
  const expected=Object.keys(DOMAIN_SCHEMAS).map(physicalName);
  const all=files.map(file=>({file,entity:JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'))}));
  const unexpected=all.filter(({entity})=>!expected.includes(entity.name)&&!['User','InternalHealthRun','AdminTestOperation','UserCalendarAction','UserPrivacyRequest','PrivacyRecoveryReceipt'].includes(entity.name)).map(({entity})=>entity.name);
  const mismatches=[];
  for(const logical of Object.keys(DOMAIN_SCHEMAS)) {
    const found=all.filter(({entity})=>entity.name===physicalName(logical));
    if(found.length!==1 || found[0].file!==`${physicalName(logical)}.jsonc` || JSON.stringify(found[0].entity)!==JSON.stringify(base44Schema(logical))) mismatches.push(logical);
  }
  return {expected:expected.length,present:all.filter(({entity})=>expected.includes(entity.name)).length,unexpected,mismatches,
    internal:all.filter(({entity})=>['InternalHealthRun','AdminTestOperation','UserCalendarAction','UserPrivacyRequest','PrivacyRecoveryReceipt'].includes(entity.name)).length,builtinUserSeparate:all.filter(({entity})=>entity.name==='User').length===1,
    healthHistoryPolicy:all.filter(({entity})=>entity.name==='InternalHealthRun').every(({entity})=>['read','create','update','delete'].every(op=>entity.rls?.[op]===false)),
    testOperationPolicy:all.filter(({entity})=>entity.name==='AdminTestOperation').length===1&&all.filter(({entity})=>entity.name==='AdminTestOperation').every(({entity})=>['read','create','update','delete'].every(op=>entity.rls?.[op]===false)&&!Object.hasOwn(entity,'unique_fields')&&!Object.hasOwn(entity.properties,'birth_date')&&!Object.hasOwn(entity.properties,'payload')),
    calendarActionPolicy:all.filter(({entity})=>entity.name==='UserCalendarAction').length===1&&all.filter(({entity})=>entity.name==='UserCalendarAction').every(({entity})=>['read','create','update','delete'].every(op=>entity.rls?.[op]===false)),
    privacyPolicies:['UserPrivacyRequest','PrivacyRecoveryReceipt'].every(name=>all.filter(({entity})=>entity.name===name).length===1&&all.filter(({entity})=>entity.name===name).every(({entity})=>['read','create','update','delete'].every(op=>entity.rls?.[op]===false))),
    accessMatrixRows:ACCESS_MATRIX.length,accessMatrixComplete:ACCESS_MATRIX.every(row=>Object.keys(row).length===13),
    directOperationsDenied:all.filter(({entity})=>expected.includes(entity.name)).every(({entity})=>['read','create','update','delete'].every(op=>entity.rls?.[op]===false)),
    source:'PHYSICAL_REPOSITORY_SCHEMAS_NOT_DEPLOYMENT_PROOF'};
}

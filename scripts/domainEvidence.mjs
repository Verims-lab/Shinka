import fs from 'node:fs';
import path from 'node:path';
import { DOMAIN_SCHEMAS, physicalName, base44Schema } from '../base44/shared/domainSchemas.js';
import { ACCESS_MATRIX } from '../base44/shared/domainSecurity.js';
export function inspectDomainSchemas(root) {
  const dir=path.join(root,'base44/entities');
  const files=fs.readdirSync(dir).filter(f=>/\.jsonc?$/.test(f));
  const expected=Object.keys(DOMAIN_SCHEMAS).map(physicalName);
  const all=files.map(file=>({file,entity:JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'))}));
  const unexpected=all.filter(({entity})=>!expected.includes(entity.name)&&!['User','InternalHealthRun'].includes(entity.name)).map(({entity})=>entity.name);
  const mismatches=[];
  for(const logical of Object.keys(DOMAIN_SCHEMAS)) {
    const found=all.filter(({entity})=>entity.name===physicalName(logical));
    if(found.length!==1 || found[0].file!==`${physicalName(logical)}.jsonc` || JSON.stringify(found[0].entity)!==JSON.stringify(base44Schema(logical))) mismatches.push(logical);
  }
  return {expected:expected.length,present:all.filter(({entity})=>expected.includes(entity.name)).length,unexpected,mismatches,
    internal:all.filter(({entity})=>entity.name==='InternalHealthRun').length,builtinUserSeparate:all.filter(({entity})=>entity.name==='User').length===1,
    accessMatrixRows:ACCESS_MATRIX.length,accessMatrixComplete:ACCESS_MATRIX.every(row=>Object.keys(row).length===13),
    directOperationsDenied:all.filter(({entity})=>expected.includes(entity.name)).every(({entity})=>['read','create','update','delete'].every(op=>entity.rls?.[op]===false)),
    source:'PHYSICAL_REPOSITORY_SCHEMAS_NOT_DEPLOYMENT_PROOF'};
}

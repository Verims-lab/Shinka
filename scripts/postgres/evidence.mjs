import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export function sqlSourceDigest(root=process.cwd()) {
  const files=['base44','postgres','scripts/postgres'].flatMap(dir=>fs.readdirSync(path.join(root,dir),{recursive:true,encoding:'utf8'}).filter(f=>/\.(js|ts|mjs|sql|jsonc)$/.test(f)).map(f=>`${dir}/${f}`));
  files.push('src/lib/AuthContext.jsx');files.sort();
  const hash=createHash('sha256');for(const file of files)hash.update(file+'\0').update(fs.readFileSync(path.join(root,file))).update('\0');return hash.digest('hex');
}
export function inspectSqlEvidence(root=process.cwd()) {
  try {
    const report=JSON.parse(fs.readFileSync(path.join(root,'docs/shinka/reports/postgres-015/local-postgres.json'),'utf8'));
    const fresh=report.sourceDigest===sqlSourceDigest(root)&&report.scope==='LOCAL_REAL_POSTGRESQL'&&report.failed===0&&report.passed===report.results.length;
    return {fresh,scope:report.scope,postgres:report.postgres,passed:report.passed,failed:report.failed,
      sourceDigest:report.sourceDigest,results:report.results.map(({name,status})=>({id:name.split(' ')[0],status})),hostedVerified:false};
  }catch{return {fresh:false,scope:'LOCAL_REAL_POSTGRESQL',hostedVerified:false,results:[]};}
}

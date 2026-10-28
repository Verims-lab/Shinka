// Local release-artifact verification only; no CLI deployment or data calls.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
const root=process.cwd(),temp=await mkdtemp(path.join(tmpdir(),'shinka-045-compat-check-'));
const fields=['message_tr_snapshot','suggestion_tr_snapshot','message_en_snapshot','suggestion_en_snapshot'];
try {
  const names=(await readdir('base44/entities')).filter(name=>name.endsWith('.jsonc')).sort();
  assert.equal(names.length,27);
  const original=new Map(await Promise.all(names.map(async name=>[name,await readFile(path.join(root,'base44/entities',name))])));
  const results=[];
  for(const mode of ['current','daily-compat','final']){
    const dest=path.join(temp,mode),args=['scripts/prepareSchemaStage.mjs',dest,'HEAD'];
    if(mode!=='current')args.push(mode); // Exercise the safe no-mode default.
    execFileSync(process.execPath,args,{cwd:root});
    const manifest=JSON.parse(await readFile(path.join(dest,'manifest.json'),'utf8'));
    assert.equal(manifest.mode,mode);assert.equal(manifest.hostedCleanupVerified,false);assert.equal(manifest.files.length,27);
    assert.equal(manifest.dailySchemaPhase,mode==='final'?'POST_CLEANUP_CANDIDATE_NOT_VERIFIED':'OPTIONAL_LEGACY_FIELDS_CLEANUP_PENDING');
    for(const name of names){
      const bytes=await readFile(path.join(dest,'base44/entities',name));
      assert.equal(manifest.files.find(row=>row.name===name).sha256,createHash('sha256').update(bytes).digest('hex'));
      if(name!=='UserDailyMessage.jsonc'||mode!=='final')assert.deepEqual(bytes,original.get(name));
      else {
        const row=JSON.parse(bytes),before=JSON.parse(original.get(name).toString());
        assert.deepEqual(row.required,before.required);assert.deepEqual(row.rls,before.rls);
        assert.deepEqual(Object.keys(row.properties).sort(),Object.keys(before.properties).filter(key=>!fields.includes(key)).sort());
        for(const key of Object.keys(row.properties))assert.deepEqual(row.properties[key],before.properties[key]);
      }
    }
    results.push({mode,status:'PASS',schemas:27,hostedCleanupVerified:false});
  }
  for(const name of names)assert.deepEqual(await readFile(path.join(root,'base44/entities',name)),original.get(name));
  console.log(JSON.stringify({scope:'LOCAL_ARTIFACTS_ONLY',passed:true,results,repositoryUnchanged:true,hostedCalls:0},null,2));
} finally {await rm(temp,{recursive:true,force:true});}

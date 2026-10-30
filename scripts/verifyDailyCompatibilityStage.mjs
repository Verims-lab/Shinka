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
  assert.equal(names.length,28);
  const original=new Map(await Promise.all(names.map(async name=>[name,await readFile(path.join(root,'base44/entities',name))])));
  const results=[];
  for(const mode of ['current','final']){
    const dest=path.join(temp,mode),args=['scripts/prepareSchemaStage.mjs',dest,'HEAD'];
    if(mode!=='current')args.push(mode); // Exercise the safe no-mode default.
    execFileSync(process.execPath,args,{cwd:root});
    const manifest=JSON.parse(await readFile(path.join(dest,'manifest.json'),'utf8'));
    assert.equal(manifest.mode,mode);assert.equal(manifest.hostedCleanupVerified,false);assert.equal(manifest.files.length,28);
    assert.equal(manifest.dailySchemaPhase,'ID_ONLY_SCHEMA');
    for(const name of names){
      const bytes=await readFile(path.join(dest,'base44/entities',name));
      assert.equal(manifest.files.find(row=>row.name===name).sha256,createHash('sha256').update(bytes).digest('hex'));
      assert.deepEqual(bytes,original.get(name));
      if(name==='GeoNamesDailyQuota.jsonc'){const row=JSON.parse(bytes);assert.equal(row.properties.scope.enum[0],'APP_CREDITS_V1');assert.equal(row.properties.buckets.maxItems,25);assert.ok(['create','read','update','delete'].every(key=>row.rls[key]===false));}
      if(name==='UserDailyMessage.jsonc'){
        const row=JSON.parse(bytes);
        assert.ok(fields.every(key=>!Object.hasOwn(row.properties,key)&&!row.required.includes(key)));
        assert.ok(['create','read','update','delete'].every(key=>row.rls[key]===false));
      }
    }
    results.push({mode,status:'PASS',schemas:28,hostedCleanupVerified:false});
  }
  assert.throws(()=>execFileSync(process.execPath,['scripts/prepareSchemaStage.mjs',path.join(temp,'retired'),'HEAD','daily-compat'],{cwd:root,stdio:'pipe'}),/retired daily-compat/);
  for(const name of names)assert.deepEqual(await readFile(path.join(root,'base44/entities',name)),original.get(name));
  console.log(JSON.stringify({scope:'LOCAL_ARTIFACTS_ONLY',passed:true,results,repositoryUnchanged:true,hostedCalls:0},null,2));
} finally {await rm(temp,{recursive:true,force:true});}

import { build } from 'vite';
import { staticEvidencePlugin } from './staticEvidence.mjs';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root=process.cwd(),destination=path.resolve(process.argv[2]||'/private/tmp/shinka-notification-cost');
if(destination===root||destination.startsWith(root+path.sep))throw new Error('Measurement output must be outside checkout');
const temporary=await mkdtemp(path.join(tmpdir(),'shinka-notification-cost-'));
try {
  const entry=path.join(temporary,'entry.mjs');
  const machine=process.argv[3]==='--machine';
  await writeFile(entry,`import { measureNotificationCosts } from ${JSON.stringify(path.join(root,'src/foundation/tests/notificationCostFixture.js'))};\nimport { createNotificationMachineAdmission } from ${JSON.stringify(path.join(root,'base44/shared/notificationMachineAuth.js'))};\nError.stackTraceLimit=30;console.log(JSON.stringify(await measureNotificationCosts(${machine?"createNotificationMachineAdmission({readSecret:()=> 'a'.repeat(64),readCredential:()=> 'a'.repeat(64)})":"null"})));\n`);
  await build({configFile:false,logLevel:'warn',plugins:[staticEvidencePlugin(root)],resolve:{alias:{'@':path.join(root,'src')}},ssr:{noExternal:true},build:{ssr:entry,outDir:path.join(temporary,'bundle'),emptyOutDir:true,rollupOptions:{output:{entryFileNames:'measure.mjs'}}}});
  const execute=promisify(execFile),{stdout}=await execute(process.execPath,[path.join(temporary,'bundle/measure.mjs')],{maxBuffer:5_000_000});
  const report=JSON.parse(stdout);report.callerMode=machine?'PREPARED_MACHINE_SYNTHETIC_READERS':'CURRENT_NATIVE_ADMIN';report.baseCommit=(await execute('git',['rev-parse','HEAD'],{cwd:root})).stdout.trim();report.sourceHashes={};
  for(const file of ['base44/shared/notificationScheduler.js','base44/shared/notificationOwner.js','base44/shared/notificationDelivery.js','base44/shared/dailyMessageOperation.js','base44/shared/userLifecycle.js','base44/shared/internalAuthorization.js','base44/shared/privacyPolicy.js','src/foundation/tests/notificationCostFixture.js','scripts/measureNotifications.mjs'])report.sourceHashes[file]=createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
  if(machine)report.sourceHashes['base44/shared/notificationMachineAuth.js']=createHash('sha256').update(await readFile(path.join(root,'base44/shared/notificationMachineAuth.js'))).digest('hex');
  await mkdir(destination,{recursive:true});await writeFile(path.join(destination,'measurement.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({scope:report.scope,initialStateHash:report.initialStateHash,scenarios:report.scenarios.map(({trace,...rest})=>rest)},null,2));
} finally {await rm(temporary,{recursive:true,force:true});}

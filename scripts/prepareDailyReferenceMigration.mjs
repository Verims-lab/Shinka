// Produces an operator-reviewed script, never invokes a hosted command.
import { build } from 'vite';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
const [input, output] = process.argv.slice(2);
if (!input || !output || !path.isAbsolute(output)) throw new Error('Usage: node scripts/prepareDailyReferenceMigration.mjs request.json /absolute/new-output.js');
const request = JSON.parse(await readFile(input,'utf8'));
if (!['dryRun','applyBatch','verify'].includes(request.action)) throw new Error('Explicit action required');
const temp = await mkdtemp(path.join(tmpdir(),'shinka-daily-reference-'));
try {
  await writeFile(temp+'/entry.js',`import {dailyReferenceMigration} from ${JSON.stringify(path.resolve('base44/shared/dailyReferenceMigration.js'))};\ntry { console.log(JSON.stringify(await dailyReferenceMigration(base44,${JSON.stringify(request)}))); } catch(e) { console.log(JSON.stringify({status:'BLOCKED',code:typeof e.code==='string'?e.code:'MIGRATION_IO_UNCONFIRMED'})); }\n`);
  await build({configFile:false,logLevel:'silent',build:{ssr:temp+'/entry.js',outDir:temp+'/out',minify:false,rollupOptions:{output:{entryFileNames:'migration.js'}}}});
  await writeFile(output,await readFile(temp+'/out/migration.js'),{flag:'wx'});
  console.log(JSON.stringify({status:'PREPARED_NOT_EXECUTED',output,action:request.action}));
} finally {await rm(temp,{recursive:true,force:true});}

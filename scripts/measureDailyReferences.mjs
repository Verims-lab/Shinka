import {build} from 'vite';
import {staticEvidencePlugin} from './staticEvidence.mjs';
import {readFile,writeFile,mkdtemp,rm,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {tmpdir} from 'node:os';
const root=process.cwd(),source=path.resolve(process.argv[2]||root),temp=await mkdtemp(path.join(tmpdir(),'shinka-daily-measure-'));
try{
  const original=await readFile(root+'/src/foundation/tests/dailyReferenceMeasurement.js','utf8');
  let code=original.replace("'./nativeFixture'",JSON.stringify(source+'/src/foundation/tests/nativeFixture.js')).replace("'./dailyFixture'",JSON.stringify(source+'/src/foundation/tests/dailyFixture.js')).replaceAll("'../../../base44/shared/","'"+source+'/base44/shared/');
  let current=false;try{await access(source+'/base44/shared/dailySelectionLibrary.js');current=true;}catch{ /* Historical baseline. */ }
  if(current)code+='\nimport {readDailySelectionLibrary} from '+JSON.stringify(source+'/base44/shared/dailySelectionLibrary.js')+';';
  await writeFile(temp+'/entry.js',code+`\nconsole.log(JSON.stringify(await measureDailyReferences(${current?'readDailySelectionLibrary':''})));`);
  await build({configFile:false,plugins:[staticEvidencePlugin(source)],logLevel:'silent',ssr:{noExternal:true},build:{ssr:temp+'/entry.js',outDir:temp+'/out',rollupOptions:{output:{entryFileNames:'entry.mjs'}}}});
  const result=JSON.parse(execFileSync(process.execPath,[temp+'/out/entry.mjs'],{maxBuffer:5_000_000}));result.instrumentHash=createHash('sha256').update(original).digest('hex');console.log(JSON.stringify(result,null,2));
}finally{await rm(temp,{recursive:true,force:true});}

import { build } from 'vite';
import { staticEvidencePlugin } from './staticEvidence.mjs';
import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
// Optional baseline checkout enables the identical instrumented fixture to run
// against both revisions. Only SDK transport is replaced; no live calls.
const root=process.cwd(),source=path.resolve(process.argv[2]||root),temp=await mkdtemp(path.join(tmpdir(),'shinka-core-data-'));
try {
  const fixture=(await readFile(path.join(root,'src/foundation/tests/coreDataMeasurement.js'),'utf8'))
    .replace("'./nativeFixture'",JSON.stringify(path.join(source,'src/foundation/tests/nativeFixture.js')))
    .replaceAll("'../../../base44/shared/","'"+source+'/base44/shared/');
  await writeFile(temp+'/entry.js',fixture+'\nconsole.log(JSON.stringify(await measureCoreData()));\n');
  await build({configFile:false,plugins:[staticEvidencePlugin(source)],logLevel:'silent',resolve:{alias:{'@':source+'/src'}},ssr:{noExternal:true},build:{ssr:temp+'/entry.js',outDir:temp+'/out',rollupOptions:{output:{entryFileNames:'entry.mjs'}}}});
  const report=JSON.parse(execFileSync(process.execPath,[temp+'/out/entry.mjs'],{maxBuffer:5_000_000}));
  report.instrumentSha256=createHash('sha256').update(await readFile(path.join(root,'src/foundation/tests/coreDataMeasurement.js'))).digest('hex');
  console.log(JSON.stringify(report,null,2));
} finally {await rm(temp,{recursive:true,force:true});}

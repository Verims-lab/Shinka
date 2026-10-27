// Identical full HTTP/service/native fixture; no live calls. An archived source
// checkout compares revisions. --wall runs the actual 30s service timer with
// 400ms per SDK call; default uses a serial SDK-cost clock, including guards.
import {build} from 'vite';
import {staticEvidencePlugin} from './staticEvidence.mjs';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {tmpdir} from 'node:os';
const root=process.cwd(),wall=process.argv.includes('--wall'),source=path.resolve(process.argv.slice(2).find(v=>v!=='--wall')||root),temp=await mkdtemp(path.join(tmpdir(),'shinka-deletion-'));
try {
 const instrument=await readFile(root+'/src/foundation/tests/deletionFixture.js','utf8');
 let fixture=instrument.replace("'./nativeFixture'",JSON.stringify(source+'/src/foundation/tests/nativeFixture.js')).replaceAll("'../../../base44/shared/","'"+source+'/base44/shared/');
 let script;
 if(wall){
  fixture=fixture.replace('state.time += latency;', 'if(delayEnabled)await new Promise(resolve=>setTimeout(resolve,400));')
   .replace('const clock = () => state.time','let delayEnabled=false;const clock = () => performance.now()')
   .replace('const start=state.time,','const start=clock(),').replace('durationMs:state.time-start','durationMs:clock()-start')
   .replace('return {...f,measure:state,','return {...f,enableDelay:()=>{delayEnabled=true;},measure:state,');
  script=`const f=deletionFixture(),view=await f.preview();f.enableDelay();const start=performance.now();let outcome;try{outcome=(await f.execute(view)).result_state;}catch(e){outcome=e.code;}
   const responseMs=performance.now()-start;for(let n=0;n<1800&&!f.measure.calls.some(c=>c.action==='execute');n++)await new Promise(r=>setTimeout(r,50));
   console.log(JSON.stringify({scope:'LOCAL_REAL_WALL_TIMERS_400MS_PER_SDK_CALL',hostedVerified:false,clientOutcome:outcome,clientResponseMs:responseMs,backend:f.measure.calls.find(c=>c.action==='execute'),remainingTargetUsers:f.tables.User.filter(r=>r.id==='ownerA').length}));`;
 }else{
  script=`const measurements=[];for(const scenario of [{latency:0,periods:0},{latency:300,periods:0},{latency:0,periods:205}]){const f=deletionFixture(scenario);await finishDeletion(f,await f.execute(await f.preview()));measurements.push({scenario,passes:f.measure.calls.filter(c=>['execute','resume'].includes(c.action)),remainingTargetUsers:f.tables.User.filter(r=>r.id==='ownerA').length});}console.log(JSON.stringify({scope:'LOCAL_SYNTHETIC_SERIAL_SDK_COST',hostedVerified:false,measurements}));`;
 }
 await writeFile(temp+'/entry.js',fixture+'\n'+script);
 await writeFile(temp+'/platform.js',"export const base44={functions:{invoke(){throw new Error('UNEXPECTED_PLATFORM_IO');}}};");
 await build({configFile:false,plugins:[staticEvidencePlugin(source)],logLevel:'silent',resolve:{alias:[{find:'@/api/base44Client',replacement:temp+'/platform.js'},{find:'@',replacement:source+'/src'}]},ssr:{noExternal:true},build:{ssr:temp+'/entry.js',outDir:temp+'/out',rollupOptions:{output:{entryFileNames:'entry.mjs'}}}});
 const report=JSON.parse(execFileSync(process.execPath,[temp+'/out/entry.mjs'],{maxBuffer:5_000_000}));
 report.instrumentSha256=createHash('sha256').update(instrument).update(await readFile(root+'/scripts/measureTestDeletion.mjs')).digest('hex');
 console.log(JSON.stringify(report,null,2));
} finally {await rm(temp,{recursive:true,force:true});}

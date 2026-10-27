// Execute the committed baseline and current controller/hook source with the
// same synthetic request and per-run clock. React lifecycle wiring is stubbed
// here only; PU06 separately executes the real hook/component in both engines.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const baseline='051e98779fca00b9c3cb139d75b7cde84317337d';
const strip=s=>s.replace(/^import .*;\n/gm,'').replace(/export /g,'');
async function measure(before) {
  const read=file=>before?execFileSync('git',['show',`${baseline}:${file}`],{encoding:'utf8'}):readFileSync(file,'utf8');
  const files=['src/features/pattern/patternController.js',...(before?[]:['src/features/pattern/patternLifecycle.js']),'src/features/pattern/usePattern.js'];
  let time=0,id=0,calls=0,blankTransitions=0,loaded=false,cleanup;const jobs=new Map();
  const set=(fn,ms,repeat=false)=>{const key=++id;jobs.set(key,{fn,at:time+ms,ms,repeat});return key;};
  const drain=()=>new Promise(resolve=>setImmediate(resolve));
  const target=new EventTarget(),doc=Object.assign(new EventTarget(),{visibilityState:'visible'});
  const request=async section=>{calls++;return {section,synthetic:true};};
  const context=vm.createContext({Event,window:target,document:doc,Date:{now:()=>time},
    setTimeout:(fn,ms)=>set(fn,ms),clearTimeout:key=>jobs.delete(key),setInterval:(fn,ms)=>set(fn,ms,true),clearInterval:key=>jobs.delete(key),
    isPatternPrivacyError:()=>false,patternRequest:request,useMemo:fn=>fn(),useSyncExternalStore:(_subscribe,get)=>get(),useEffect:fn=>{cleanup=fn();}});
  const sources=files.map(read);vm.runInContext(sources.map(strip).join('\n'),context);
  const {controller}=vm.runInContext('usePattern()',context);
  controller.subscribe(()=>{const state=controller.getSnapshot();if(loaded&&!state.themes.value&&!state.lunar.value)blankTransitions++;});
  await drain();loaded=true;
  const advance=async ms=>{const end=time+ms;while(true){const entry=[...jobs.entries()].sort((a,b)=>a[1].at-b[1].at)[0];if(!entry||entry[1].at>end)break;const [key,job]=entry;time=job.at;jobs.delete(key);if(job.repeat)jobs.set(key,{...job,at:time+job.ms});job.fn();await drain();}time=end;};
  const initialCalls=calls;await advance(120000);const at120={calls,blankTransitions};await advance(180000);const at300={calls,blankTransitions};
  await advance(1001);const beforeBurst=calls;target.dispatchEvent(new Event('focus'));target.dispatchEvent(new Event('online'));doc.dispatchEvent(new Event('visibilitychange'));await drain();const burstCalls=calls-beforeBurst;
  cleanup();assert.equal(jobs.size,0);
  return {source:before?baseline:'working-source',sha256:Object.fromEntries(files.map((file,i)=>[file,createHash('sha256').update(sources[i]).digest('hex')])),initialCalls,at120,at300,burstCalls,remainingTimers:jobs.size};
}
const before=await measure(true),after=await measure(false);
assert.equal(before.at120.calls,6);assert(before.at120.blankTransitions>0);assert.equal(after.at120.calls,2);assert.equal(after.at300.calls,4);assert.equal(after.at300.blankTransitions,0);assert.equal(before.burstCalls,6);assert.equal(after.burstCalls,2);
console.log(JSON.stringify({scope:'LOCAL_CONTROLLED_CLOCK_SYNTHETIC_NO_NETWORK',before,after,limitations:'Request counts and blank transitions only; no live speed, credit or physical-device claim. React lifecycle wiring stubbed; real hook/component covered by PU06.'},null,2));

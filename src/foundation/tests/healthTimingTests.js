import { captureFixtureConsole } from './fixtureConsole';
import { executeTest } from '../testExecution';
import { syntheticProbe } from '../health/cases/domainProbe';
import { createTestProgress } from '../health/testProgress';
import { makeCase } from '../health/caseFactory';
import { CLASS, RUNNER } from '../health/constants';
import { createTestClock, testEventTurn } from './testClock';
import { ADMIN_NAV_TESTS } from './adminNavigationTests';
const check=(value,reason='timing contract')=>{if(!value)throw new Error(reason);};
const rejected=async(work,code)=>{try{await work;}catch(error){check(error.code===code,`expected ${code}`);return;}throw new Error('Expected rejection');};
const caseFor=(run,timeoutMs=1000)=>makeCase('H16',{classification:CLASS.SYNTHETIC_RUNTIME,runnerType:RUNNER.RUNTIME})('H16-999','Timing fixture','Isolated fixture',run,{timeoutMs});
const runner=async()=> (await import('../health/runner')).executeCase;
/** @type {import('./testTypes').FoundationTest[]} */
export const HEALTH_TIMING_TESTS=[
 ['HT01','Outer timeout retains completed helpers and active phase; late work cannot cache or dispatch',async()=>{
   const executeCase=await runner(),cache=new Map();let finish=()=>{},cleaned=0,next=0;
   const done=['HT91','completed',()=>true];
   const waiting=['HT92','waiting',context=>{
     const timer=setTimeout(()=>{throw new Error('Leaked fixture timer');},1000);
     context.cleanup(()=>{clearTimeout(timer);cleaned++;});context.stage('BODY_WAIT');
     return new Promise(resolve=>{finish=()=>{context.stage('private fixture value');resolve(true);};});
   }];
   const def=caseFor(syntheticProbe([done,waiting,['HT93','must not dispatch',()=>{next++;}]]),30);
   const result=await executeCase(def,{testResults:cache});
   check(result.status==='BLOCKED'&&result.attempted&&!result.executed);
   const progress=result.evidence.actual.helpers;
   check(progress.completed.length===1&&progress.completed[0].id==='HT91'&&progress.completed[0].stage==='COMPLETE');
   check(progress.active.id==='HT92'&&progress.active.stage==='BODY_WAIT'&&progress.active.durationMs>=10);
   check(cleaned===1&&next===0&&!cache.has(waiting[2]));
   const snapshot=JSON.stringify(progress);finish();await testEventTurn();
   check(snapshot===JSON.stringify(progress)&&!cache.has(waiting[2])&&next===0);
   check((await executeCase(caseFor(syntheticProbe([done])),{testResults:cache})).status==='PASS');
 }],
 ['HT02','Per-helper budget stops sequential dispatch and never caches an unfinished success',async()=>{
   const cache=new Map();let cleaned=0,next=0;
   const wait=['HT91','wait',context=>{context.cleanup(()=>{cleaned++;});return new Promise(()=>{});}];
   await rejected(syntheticProbe([wait,['HT92','next',()=>{next++;}]])({testResults:cache,remainingMs:()=>10}),'TEST_TIMEOUT');
   check(cleaned===1&&next===0&&cache.size===0);
 }],
 ['HT03','Pre-cancelled and active cancelled cases stop immediately; cleanup precedes next case',async()=>{
   const executeCase=await runner(),parent=new AbortController();let runs=0,disposed=0,late=()=>{};
   parent.abort();const pre=await executeCase(caseFor(syntheticProbe([['HT91','no dispatch',()=>{runs++;}]])),{},parent.signal);
   check(pre.status==='BLOCKED'&&runs===0);
   check((await executeCase(caseFor(null),{},parent.signal)).status==='BLOCKED');
   const active=new AbortController();const cache=new Map();
   const test=['HT92','active',context=>{
     context.cleanup(()=>{disposed++;});context.stage('ACTIVE_WAIT');
     active.abort();check(disposed===1,'cleanup must be synchronous on parent abort');
     return new Promise(resolve=>{late=()=>resolve(true);});
   }];
   const result=await executeCase(caseFor(syntheticProbe([test])),{testResults:cache},active.signal);
   check(result.status==='BLOCKED'&&!result.executed&&cache.size===0&&disposed===1);
   late();await testEventTurn();check(cache.size===0);
   check((await executeCase(caseFor(syntheticProbe([['HT93','next case',()=>true]])),{testResults:new Map()})).status==='PASS');
 }],
 ['HT04','Only completed successes reuse within a run; failed/pending entries and new runs re-execute',async()=>{
   let runs=0,failures=0;const test=['HT91','success',()=>{runs++;}],bad=['HT92','failed',()=>{failures++;throw new Error('synthetic');}];
   const cache=new Map([[test[2],Promise.resolve(true)]]);
   const probe=syntheticProbe([test]);await probe({testResults:cache});const second=await probe({testResults:cache});
   check(runs===1&&second.status==='PASS'&&second.evidence.actual.reused.join()==='HT91');
   for(let i=0;i<2;i++)check((await syntheticProbe([bad])({testResults:cache})).status==='FAIL');
   check(failures===2&&!cache.has(bad[2]));await probe({testResults:new Map()});check(runs===2);
 }],
 ['HT05','Controlled timers are fixture-local; parent cancellation disposes pending jobs before returning',async()=>{
   const parent=new AbortController();let fired=0,aborted=0;
   /** @type {ReturnType<typeof createTestClock> | undefined} */ let clock;
   const work=executeTest(['HT91','clock cancellation',context=>{
     clock=createTestClock(context);clock.timers.set(()=>{fired++;},500);
     context.signal.addEventListener('abort',()=>{aborted++;},{once:true});
     return new Promise(()=>{});
   }],{signal:parent.signal});
   await Promise.resolve();parent.abort();check(clock?.pending()===0&&aborted===1);
   await rejected(work,'TEST_CANCELLED');check(fired===0);
   const next=createTestClock();next.timers.set(()=>{fired++;},5);await next.advance(5);check(fired===1&&next.pending()===0);next.dispose();
 }],
 ['HT06','Cancelled real admin navigation removes its React root and waiters; a fresh fixture succeeds',async()=>{
   const test=ADMIN_NAV_TESTS.find(([id])=>id==='AN08'),parent=new AbortController();let entered=false;
   const work=executeTest(test,{signal:parent.signal,onStage:({stage})=>{if(stage==='DOM_NAVIGATION'){entered=true;parent.abort();}}});
   await rejected(work,'TEST_CANCELLED');check(entered&&!document.querySelector('[data-admin-test-fixture]'));
   await executeTest(test);check(!document.querySelector('[data-admin-test-fixture]'));
 }],
 ['HT07','Progress records closed safe IDs/phases/durations only and freezes at close',()=>{
   const progress=createTestProgress();progress.update({id:'HT91',stage:'COMPLETE',durationMs:3,private:'secret'});
   progress.update({id:'secret@example.invalid',stage:'private-token',durationMs:-1,body:'secret'});progress.close();
   const snapshot=JSON.stringify(progress.snapshot());progress.update({id:'HT92',stage:'COMPLETE',durationMs:9});
   check(snapshot===JSON.stringify(progress.snapshot())&&!snapshot.includes('secret')&&!snapshot.includes('private'));
   check(progress.snapshot().active.id==='TEST'&&progress.snapshot().active.stage==='HELPER');
 }],
 ['HT08','Late timer delivery cannot accept over-budget work; disposal failures cannot cache PASS',async()=>{
   await rejected(executeTest(['HT91','event loop occupied',()=>{const until=performance.now()+5;while(performance.now()<until){/* intentional bounded fault injection */}}],{timeoutMs:1}),'TEST_TIMEOUT');
   const cache=new Map();let disposed=0;
   const bad=['HT92','cleanup failure',context=>{context.cleanup(()=>{throw new Error('fixture cleanup failure');});context.cleanup(()=>{disposed++;});}];
   const result=await syntheticProbe([bad])({testResults:cache});check(result.status==='FAIL'&&disposed===1&&cache.size===0);
 }],
 ['HT09','Abort restores console hooks once; late cleanup cannot overwrite the following fixture',async()=>{
   const original=console.debug,parent=new AbortController();
   /** @type {ReturnType<typeof captureFixtureConsole>} */ let captured;
   const work=executeTest(['HT91','console fixture',context=>{
     captured=captureFixtureConsole(['debug'],context);return new Promise(()=>{});
   }],{signal:parent.signal});
   await Promise.resolve();check(console.debug!==original);parent.abort();check(console.debug===original);
   await rejected(work,'TEST_CANCELLED');
   const next=captureFixtureConsole(['debug']);
   try{captured.dispose();console.debug('synthetic');check(next.count()===1);}finally{next.dispose();}
   check(console.debug===original);
 }],

];

import { cancelledTest } from '../testExecution';
// Per-fixture scheduler: no global monkey patch and no wall-time sleeps. Real
// AbortController and stream cancellation still execute in the adapter/probe.
export function testEventTurn(signal) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted) return reject(cancelledTest());
    const channel=new MessageChannel();
    const close=()=>{channel.port1.close();channel.port2.close();signal?.removeEventListener('abort',abort);};
    const abort=()=>{close();reject(cancelledTest());};
    channel.port1.onmessage=()=>{close();resolve();};
    signal?.addEventListener('abort',abort,{once:true});channel.port2.postMessage(null);
  });
}
export function createTestClock(context = {}) {
  let now=0,next=0,closed=false,wake=()=>{};
  const jobs=new Map();
  const assertOpen=()=>{if(closed||context.signal?.aborted)throw cancelledTest();};
  const timers={set:(fn,ms)=>{assertOpen();const id=++next;jobs.set(id,{fn,at:now+Math.max(0,ms)});wake();return id;},clear:id=>{jobs.delete(id);}};
  const first=()=>[...jobs.entries()].sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];
  const fire=()=>{assertOpen();const [id,job]=first();jobs.delete(id);now=job.at;job.fn();};
  const dispose=()=>{closed=true;jobs.clear();wake();context.signal?.removeEventListener('abort',dispose);};
  context.signal?.addEventListener('abort',dispose,{once:true});
  context.cleanup?.(dispose);
  return {
    timers,now:()=>now,pending:()=>jobs.size,dispose,
    async advance(ms){assertOpen();const end=now+ms;let limit=1000;await testEventTurn(context.signal);while(first()?.[1].at<=end){if(--limit<0)throw new Error('TEST_CLOCK_LOOP');fire();await testEventTurn(context.signal);}now=end;},
    async run(work){
      assertOpen();let settled=false,value,error,failed=false;
      Promise.resolve().then(work).then(v=>{value=v;settled=true;wake();},e=>{error=e;failed=true;settled=true;wake();});
      for(let i=0;i<1000;i++){
        // A MessageChannel turn drains native Request/Response promises too,
        // without depending on a short wall timer or rendering frame.
        await testEventTurn(context.signal);assertOpen();
        if(settled){if(failed)throw error;return value;}
        if(!jobs.size){
          // Native crypto/body work may finish on another task. Sleep until
          // actual work settles, schedules a deadline, or the fixture aborts.
          await new Promise(resolve=>{wake=()=>resolve(undefined);if(settled||jobs.size||closed)wake();});
          continue;
        }
        fire();
      }
      throw new Error('TEST_CLOCK_LOOP');
    },
  };
}
export const withTestClock = run => async (context = {}) => {
  const clock=createTestClock(context);
  try{return await run(clock,context);}finally{clock.dispose();}
};

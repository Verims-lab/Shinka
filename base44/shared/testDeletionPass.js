import { testToolError } from './adminTestPolicy.js';

// Invocation-local work budget, not a timer that cancels an in-flight SDK call.
// Admission/checkpoint/readback costs are measured separately in total elapsed.
export function testDeletionPass(clock = () => performance.now()) {
  const started=clock();let workStarted=null, attempts=0, processed=0, initial=[], initialStatus=null, created=false, reason='RUNNING', activeStage='START', remaining=null;
  return {
    start(job, isNew=false) { initial=[...job.checkpoints];initialStatus=job.status;created=isNew; },
    work() { workStarted=clock(); },
    stage(value) { activeStage=value; },
    get remainingWrites() { return 100-attempts; },
    exhausted() { return attempts>=100 || workStarted!==null && clock()-workStarted>=8000; },
    spend() {
      workStarted ??= clock();
      if(this.exhausted()){remaining=1;testToolError('TEST_CLEANUP_MORE_REQUIRED',503);}
      attempts++;
    },
    confirmed() { processed++; },
    more() { remaining=1; },
    stop(value) { reason=value; },
    summary(job, resultState) {
      const checkpoints=job?.checkpoints||[], changed=checkpoints.some(stage=>!initial.includes(stage)) || initial.some(stage=>!checkpoints.includes(stage));
      return { contract:'shinka.deletion-pass/1', operationId:job.operation_id, stage:activeStage,
        processed, remainingAtLeast:resultState==='COMPLETED'?0:remaining, remainingExact:resultState==='COMPLETED'?0:null,
        checkpoints, madeProgress:created||processed>0||changed||job.status!==initialStatus&&job.status==='COMPLETED',
        elapsedMs:Math.max(0,Math.round(clock()-started)), workMs:workStarted===null?0:Math.max(0,Math.round(clock()-workStarted)),
        writeAttempts:attempts, reason:resultState==='COMPLETED'?'COMPLETED':reason, workBudgetMs:8000, writeLimit:100 };
    },
  };
}

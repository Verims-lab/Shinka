import { safeTestId, safeTestStage } from '../testExecution';
// Closed diagnostic projection, scoped to exactly one case invocation.
export function createTestProgress(forward) {
  const completed = []; let active = null, closed = false, updatedAt = 0;
  const update = value => {
    if (closed) return;
    const row = { id:safeTestId(value.id), stage:safeTestStage(value.stage), durationMs:Number.isFinite(value.durationMs) ? Math.max(0,Math.min(3600000,Math.round(value.durationMs))) : 0 };
    if (['COMPLETE','FAILED','REUSED'].includes(row.stage)) { completed.push(row); active=null; }
    else { active=row; updatedAt=performance.now(); }
    forward?.({...row});
  };
  const current=()=>active?{...active,durationMs:Math.min(3600000,active.durationMs+(closed?0:Math.round(performance.now()-updatedAt)))}:null;
  return { update, close:()=>{active=current();closed=true;}, snapshot:()=>({completed:completed.map(row=>({...row})),active:current()}) };
}

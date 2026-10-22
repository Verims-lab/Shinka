import { withTimeout } from '@/foundation/errors';
import { base44 } from '@/api/base44Client';
import { ShinkaError } from '@/foundation/errors';
// Per-report receipt lives in caller-owned memory, never URL/log/history evidence.
export async function saveHealthRun(report, recovery = {}) {
  try { return (await withTimeout(base44.functions.invoke('internalHealth',{action:'save',report,...(recovery.uploadReceipt?{uploadReceipt:recovery.uploadReceipt}:{})}),30000)).data; }
  catch(error) {
    const data=error?.response?.data;
    if(typeof data?.uploadReceipt==='string'&&data.uploadReceipt.length<4000)recovery.uploadReceipt=data.uploadReceipt;
    throw historyError(error);
  }
}
export async function listHealthRuns(_limit=20) {return (await withTimeout(base44.functions.invoke('internalHealth',{action:'list'}),30000)).data.runs;}
export async function fullReportUrl(run) {return (await withTimeout(base44.functions.invoke('internalHealth',{action:'report',runId:run.id}),30000)).data.signed_url;}

export async function checkHealthRun(report) {
  try {return (await withTimeout(base44.functions.invoke('internalHealth',{action:'saveStatus',report}),30000)).data;}
  catch(error){throw historyError(error);}
}

function historyError(error) {
  const data=error?.response?.data;
  const safe=value=>typeof value==='string'&&/^[A-Z0-9_-]{1,100}$/i.test(value)?value:null;
  const code=safe(data?.error_code)||(error?.code==='TIMEOUT'?'HEALTH_SAVE_RESPONSE_UNKNOWN':'HEALTH_HISTORY_PERSIST_FAILED');
  return new ShinkaError(code,[safe(data?.stage),safe(data?.request_id)].filter(Boolean).join(' · '));
}

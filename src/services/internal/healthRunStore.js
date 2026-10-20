import { base44 } from '@/api/base44Client';
import { ShinkaError } from '@/foundation/errors';
// Per-report receipt lives in caller-owned memory, never URL/log/history evidence.
export async function saveHealthRun(report, recovery = {}) {
  try { return (await base44.functions.invoke('internalHealth',{action:'save',report,...(recovery.uploadReceipt?{uploadReceipt:recovery.uploadReceipt}:{})})).data; }
  catch(error) {
    const data=error?.response?.data;
    if(typeof data?.uploadReceipt==='string'&&data.uploadReceipt.length<4000)recovery.uploadReceipt=data.uploadReceipt;
    const safe=value=>typeof value==='string'&&/^[A-Z0-9_-]{1,100}$/i.test(value)?value:null;
    const code=safe(data?.error_code)||'HEALTH_HISTORY_PERSIST_FAILED';
    throw new ShinkaError(code,[safe(data?.stage),safe(data?.request_id)].filter(Boolean).join(' · '));
  }
}
export async function listHealthRuns(_limit=20) {return (await base44.functions.invoke('internalHealth',{action:'list'})).data.runs;}
export async function fullReportUrl(run) {return (await base44.functions.invoke('internalHealth',{action:'report',runId:run.id})).data.signed_url;}

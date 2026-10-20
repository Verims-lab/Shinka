import { InternalError } from './internalAuthorization.js';
import { normalizeStoredReport, buildHistoryRecord } from './healthHistoryContract.js';
import { hashToolValue } from './adminTestPolicy.js';
import { createPreviewSigner } from './adminTestPreview.js';

// Domain-separated capability for retrying an already uploaded private artifact.
// It grants no file read or product access; every request still requires admin.
export const healthUploadSigner = secret => typeof secret === 'string' && secret.length >= 32 ? createPreviewSigner(`health-upload/1:${secret}`, () => new Date(), 86400000) : null;
const failure = (code, stage, receipt = null) => Object.assign(new InternalError(code,503), {stage, ...(receipt?{uploadReceipt:receipt}:{})});
export async function saveHealthReport(client, body, signer) {
  let report;
  try { report = normalizeStoredReport(body.report); }
  catch (error) { error.stage='REPORT_VALIDATION'; throw error; }
  const store=client.asServiceRole.entities.InternalHealthRun, core=client.asServiceRole.integrations.Core;
  const digest=await hashToolValue(report);
  const binding={purpose:'health-upload/1',run_id:report.runId,digest};
  const lookup=async()=>{
    let rows;
    try {rows=await store.filter({run_id:report.runId},'id',2);}
    catch {throw failure('HEALTH_HISTORY_LOOKUP_FAILED','READBACK');}
    if(!Array.isArray(rows)||rows.length>1)throw failure('HEALTH_HISTORY_CONFLICT','READBACK');
    const row=rows[0];
    if(row) {
      if(row.report_digest!==digest)throw failure('HEALTH_HISTORY_CONFLICT','REPORT_VALIDATION');
      const expected=buildHistoryRecord(report,row.report_file_uri);
      if(!row.id||Object.entries(expected).some(([key,value])=>row[key]!==value))throw failure('HEALTH_HISTORY_READBACK_FAILED','READBACK');
    }
    return row;
  };
  const existing=await lookup();
  if(existing)return {id:existing.id,run_id:report.runId,reused:true};
  // A server-signed receipt is retained by the caller when create/readback fails.
  // Never accept a caller-chosen URI without this report-bound capability.
  if(!signer)throw failure('HEALTH_UPLOAD_SIGNER_UNAVAILABLE','PRIVATE_UPLOAD');
  let uri,receipt=body.uploadReceipt||null;
  if(receipt) {
    try {uri=(await signer.verify(receipt,binding)).file_uri;}
    catch {throw failure('HEALTH_UPLOAD_RECEIPT_INVALID','PRIVATE_UPLOAD');}
  } else {
    try {
      const file=new File([JSON.stringify(report)],`health-${report.runId}.json`,{type:'application/json'});
      uri=(await core.UploadPrivateFile({file})).file_uri;
      buildHistoryRecord(report,uri); // Reject public/malformed artifact responses.
      receipt=await signer.sign({...binding,file_uri:uri});
    } catch {throw failure('HEALTH_PRIVATE_UPLOAD_UNCONFIRMED','PRIVATE_UPLOAD');}
  }
  // A competing/lost-ack request may have persisted while the upload ran.
  const beforeCreate=await lookup().catch(error=>{error.uploadReceipt=receipt;throw error;});
  if(beforeCreate)return {id:beforeCreate.id,run_id:report.runId,reused:true};
  try {await store.create({...buildHistoryRecord(report,uri),report_digest:digest});}
  catch {
    // A thrown SDK call is not evidence that the row was not written.
    const saved=await lookup().catch(()=>null);
    if(saved)return {id:saved.id,run_id:report.runId,reused:true};
    throw failure('HEALTH_HISTORY_CREATE_FAILED','HISTORY_CREATE',receipt);
  }
  let saved;
  try {saved=await lookup();} catch(error) {error.uploadReceipt=receipt;throw error;}
  if(!saved)throw failure('HEALTH_HISTORY_READBACK_FAILED','READBACK',receipt);
  return {id:saved.id,run_id:report.runId,reused:false};
}

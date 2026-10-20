import { CONTENT_SOURCE_SHA256 } from './contentSourceReceipt.js';
export const CONTENT_ENTITY_NAMES = Object.freeze(['MessageCategoryLookup','MessageCategoryMapping','MessagePair']);

// No permanent zero-row rule: importing content requires an approved new validation policy.
export function contentStatePolicy(buildMarker) {
  const match=/^Buildmarker-(\d{3})$/.exec(buildMarker);
  if(!match)return 'UNRECOGNIZED_PACKAGE';
  const version=Number(match[1]);
  // Packages 009 (maintenance) and 010 (admin navigation) are pre-content; it does not authorize content imports.
  return [7,8,9,10].includes(version)?'PRE_CONTENT_ZERO_ROWS':[11,12,13,14,15,16].includes(version)?'VERIFIED_CONTENT_IMPORT_STAGES':'APPROVED_CONTENT_VALIDATION_REQUIRED';
}

export function evaluateContentState(buildMarker, counts, importPerformed, verification=null) {
  const policy=contentStatePolicy(buildMarker);
  const expected={policy,entities:CONTENT_ENTITY_NAMES,rows:policy==='PRE_CONTENT_ZERO_ROWS'?0:'approved imported counts/content',importPerformed:false};
  if(policy==='VERIFIED_CONTENT_IMPORT_STAGES')return evaluateImportStage(counts,verification);
  if(policy!=='PRE_CONTENT_ZERO_ROWS')return {status:'BLOCKED',code:policy,expected};
  const records=Array.isArray(counts?.results)?counts.results:[];
  const valid=p=>p?.state==='MEASURED'&&Number.isSafeInteger(p.count)&&p.count>=0;
  const unexpected=records.filter(p=>CONTENT_ENTITY_NAMES.includes(p?.entity)&&valid(p)&&p.count>0).map(p=>({entity:p.entity,count:p.count,provenance:'live service-role aggregate; row provenance not inspected'}));
  // A positive measured count is a failure even if another entity or the validator is unavailable.
  if(unexpected.length)return {status:'FAIL',code:'UNEXPECTED_PRODUCT_CONTENT_PRESENT',unexpected,expected};
  if(importPerformed===true)return {status:'FAIL',code:'CONTENT_IMPORT_PERFORMED',expected};
  const complete=counts?.source==='LIVE_BASE44_COUNT'&&Number.isFinite(Date.parse(counts?.measuredAt))&&records.length===3&&CONTENT_ENTITY_NAMES.every(name=>records.filter(p=>p?.entity===name&&valid(p)).length===1);
  if(!complete)return {status:'BLOCKED',code:'LIVE_CONTENT_COUNT_UNAVAILABLE',expected};
  if(importPerformed!==false)return {status:'BLOCKED',code:'IMPORT_OPERATION_EVIDENCE_UNAVAILABLE',expected};
  return {status:'PASS',code:'PRE_CONTENT_EMPTY_VERIFIED',expected};
}

function evaluateImportStage(counts, verification) {
  const expected={policy:'VERIFIED_CONTENT_IMPORT_STAGES',preImport:[0,0,0],imported:[6,240,260],exactSourceAndRelations:true};
  const rows=counts?.results;
  if(counts?.source!=='LIVE_BASE44_COUNT'||!Number.isFinite(Date.parse(counts.measuredAt))||!Array.isArray(rows)||rows.length!==3||CONTENT_ENTITY_NAMES.some(entity=>rows.filter(row=>row.entity===entity&&row.state==='MEASURED'&&Number.isSafeInteger(row.count)&&row.count>=0).length!==1))return {status:'BLOCKED',code:'LIVE_CONTENT_COUNT_UNAVAILABLE',expected};
  if(!verification||verification.sourceHash!==CONTENT_SOURCE_SHA256)return {status:'BLOCKED',code:'CONTENT_VERIFICATION_UNAVAILABLE',expected};
  const empty=rows.every(row=>row.count===0);
  if(empty&&['SOURCE_DECISION_REQUIRED','PRE_IMPORT'].includes(verification.phase)&&verification.ready===false)return {status:'PASS',code:'PRE_IMPORT_VERIFIED_NOT_PRODUCTION_READY',expected};
  const sizes={MessageCategoryLookup:6,MessageCategoryMapping:240,MessagePair:260};
  const entities=['message_category_lookup','message_category_mapping','message_pair'];
  const full=verification.phase==='VERIFIED_IMPORTED'&&verification.ready===true&&rows.every(row=>row.count===sizes[row.entity])&&verification.conflicts?.length===0&&entities.every((entity,i)=>verification.counts?.[entity]?.create===0&&verification.counts[entity].conflicts===0&&verification.counts[entity].same===[6,240,260][i])&&verification.pairIds?.length===260&&new Set(verification.pairIds.map(row=>row.source_pair_id)).size===260&&new Set(verification.pairIds.map(row=>row.platform_id)).size===260;
  const exactIds=full&&Array.from({length:260},(_,i)=>`SHF-${String(i+1).padStart(3,'0')}`).every(id=>verification.pairIds.some(row=>row.source_pair_id===id&&typeof row.platform_id==='string'&&row.platform_id.length>0));
  return {status:exactIds?'PASS':'FAIL',code:exactIds?'IMPORTED_CONTENT_VERIFIED':'CONTENT_PARTIAL_OR_CONFLICT',expected};
}

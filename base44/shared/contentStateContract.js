export const CONTENT_ENTITY_NAMES = Object.freeze(['MessageCategoryLookup','MessageCategoryMapping','MessagePair']);

// No permanent zero-row rule: importing content requires an approved new validation policy.
export function contentStatePolicy(buildMarker) {
  const match=/^Buildmarker-(\d{3})$/.exec(buildMarker);
  if(!match)return 'UNRECOGNIZED_PACKAGE';
  const version=Number(match[1]);
  return version>=7&&version<9?'PRE_CONTENT_ZERO_ROWS':'APPROVED_CONTENT_VALIDATION_REQUIRED';
}

export function evaluateContentState(buildMarker, counts, importPerformed) {
  const policy=contentStatePolicy(buildMarker);
  const expected={policy,entities:CONTENT_ENTITY_NAMES,rows:policy==='PRE_CONTENT_ZERO_ROWS'?0:'approved imported counts/content',importPerformed:false};
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

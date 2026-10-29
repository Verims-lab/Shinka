import { CONTENT_SOURCE_SHA256 } from '../../../base44/shared/contentSourceReceipt.js';
export const verifiedLibrary = () => ({
  sourceHash: CONTENT_SOURCE_SHA256, phase: 'VERIFIED_IMPORTED', ready: true, conflicts: [],
  counts: Object.fromEntries(['message_category_lookup','message_category_mapping','message_pair'].map((name,i)=>[name,{create:0,conflicts:0,same:[6,240,260][i]}])),
  pairIds: Array.from({length:260},(_,i)=>({source_pair_id:`SHF-${String(i+1).padStart(3,'0')}`,platform_id:`synthetic-pair-${i}`})),
});
export const verifiedMoon = () => ({ ready: true, create: 0, conflicts: [] });
export const verifiedCounts = () => ({ source:'LIVE_BASE44_COUNT', measuredAt:'2026-10-30T00:00:00Z', results:['MessageCategoryLookup','MessageCategoryMapping','MessagePair'].map((entity,i)=>({entity,state:'MEASURED',count:[6,240,260][i]})) });

// Only names/states cross the server boundary; product rows are never fetched into the browser.
import { base44 } from "@/api/base44Client";
import { invokeHealthRead } from './healthReadService';
export async function probeDomainEntities() {
  return (await base44.functions.invoke("internalHealth", { action:"probe" })).data.results;
}
export async function countLiveContentRows(options) {
  return invokeHealthRead('internalHealth', { action: 'contentCounts' }, undefined, options);
}
export async function verifyLiveContentLibrary(options) {
  return invokeHealthRead('contentLibrary', { action: 'verify' }, undefined, options);
}

export async function probeNativeReadiness(options) { return invokeHealthRead('internalHealth', { action: 'nativeReadiness' }, undefined, options); }
export async function verifyLiveMoon(options) { return invokeHealthRead('contentLibrary', { action: 'moonDryRun' }, undefined, options); }

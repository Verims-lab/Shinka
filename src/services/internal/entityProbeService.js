// Only names/states cross the server boundary; product rows are never fetched into the browser.
import { base44 } from "@/api/base44Client";
import { invokeHealthRead } from './healthReadService';
export async function probeDomainEntities() {
  return (await base44.functions.invoke("internalHealth", { action:"probe" })).data.results;
}
export async function countLiveContentRows() {
  return invokeHealthRead('internalHealth', { action: 'contentCounts' });
}
export async function verifyLiveContentLibrary() {
  return invokeHealthRead('contentLibrary', { action: 'verify' });
}

export async function probeNativeReadiness() { return invokeHealthRead('internalHealth', { action: 'nativeReadiness' }); }
export async function verifyLiveMoon() { return (await base44.functions.invoke('contentLibrary', { action: 'moonDryRun' })).data; }

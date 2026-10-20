// Only names/states cross the server boundary; product rows are never fetched into the browser.
import { base44 } from "@/api/base44Client";
export async function probeDomainEntities() {
  return (await base44.functions.invoke("internalHealth", { action:"probe" })).data.results;
}
export async function countLiveContentRows() {
  return (await base44.functions.invoke("internalHealth", { action:"contentCounts" })).data;
}
export async function verifyLiveContentLibrary() {
  return (await base44.functions.invoke('contentLibrary', { action: 'verify' })).data;
}

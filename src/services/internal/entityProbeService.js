// Only names/states cross the server boundary; product rows are never fetched into the browser.
import { base44 } from "@/api/base44Client";
export async function probeDomainEntities() {
  return (await base44.functions.invoke("internalHealth", { action:"probe" })).data.results;
}

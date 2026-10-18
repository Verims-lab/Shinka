// INTERNAL TOOLING — probes whether planned domain entities physically exist (count only, no record data).
import { base44 } from "@/api/base44Client";
import { DOMAIN_ENTITIES } from "@/foundation/domainContract";
import { httpStatusOf, withTimeout } from "@/foundation/errors";

export async function probeDomainEntities() {
  const results = await Promise.all(DOMAIN_ENTITIES.map(async (d) => {
    try {
      await withTimeout(base44.entities[d.plannedName].list("-created_date", 1), 10000);
      return { name: d.name, plannedName: d.plannedName, state: "PRESENT" };
    } catch (e) {
      return { name: d.name, plannedName: d.plannedName, state: httpStatusOf(e) === 404 ? "ABSENT" : "INCONCLUSIVE" };
    }
  }));
  return results;
}
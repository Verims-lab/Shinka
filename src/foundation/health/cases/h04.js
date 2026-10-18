import { DOMAIN_ENTITIES, RELATIONSHIPS, RELATIONSHIP_SOURCE, INTERNAL_TOOLING_ENTITIES } from "@/foundation/domainContract";
import { CAPABILITY_REGISTER } from "@/foundation/capabilityRegister";
import { CLASS, RUNNER } from "../constants";
import { ev, verdict, blockedResult } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H04");
const names = DOMAIN_ENTITIES.map((d) => d.name);

export const H04_CASES = [
  c("H04-001", "Authoritative domain entity count = 20", "Domain contract lists exactly 20 unique entities.", async () =>
    verdict(names.length === 20 && new Set(names).size === 20, ev(CLASS.STATIC, "domainContract.js", { count: names.length, unique: new Set(names).size }, { count: 20, unique: 20 }, "Contract inspection"))),
  c("H04-002", "Domain entity names documented", "Every domain entity name appears in SHINKA_DATA_MODEL.md.", async (ctx) => {
    const doc = (await ctx.inspection()).docs;
    const undocumented = doc.missingDomainEntities;
    return verdict(doc.present === 12 && undocumented.length === 0, ev(CLASS.STATIC, "docs/shinka/SHINKA_DATA_MODEL.md", { undocumented }, { undocumented: [] }, "Doc cross-check"));
  }),
  c("H04-003", "Internal tooling excluded from domain count", "Internal entities are Internal*-prefixed and absent from the 20-entity contract.", async () => {
    const bad = INTERNAL_TOOLING_ENTITIES.filter((i) => !i.name.startsWith("Internal") || DOMAIN_ENTITIES.some((d) => d.plannedName === i.name)).map((i) => i.name);
    return verdict(bad.length === 0, ev(CLASS.STATIC, "domainContract.js", { internal: INTERNAL_TOOLING_ENTITIES.map((i) => i.name), bad }, { bad: [] }, "Namespace check"));
  }),
  c("H04-004", "Relationship source registered", "Relationships come from the registered workbook and reference known entities.", async () => {
    const known = (ref) => ref.startsWith("User.") || names.includes(ref.split(".")[0]);
    const unknown = RELATIONSHIPS.filter((r) => !known(r.from) || !known(r.to)).map((r) => `${r.from}->${r.to}`);
    return verdict(!!RELATIONSHIP_SOURCE && RELATIONSHIPS.length >= 19 && unknown.length === 0, ev(CLASS.STATIC, RELATIONSHIP_SOURCE, { relationships: RELATIONSHIPS.length, unknown }, { relationships: "≥19", unknown: [] }, "Relationship inspection"));
  }),
  c("H04-005", "Base44-unverified constraints marked unverified", "No UNIQUE/INDEX/FK constraint is VERIFIED while its platform capability is unverified.", async () => {
    const capVerified = ["CAP-02", "CAP-03", "CAP-04", "CAP-05"].every((id) => CAPABILITY_REGISTER.find((x) => x.id === id)?.status === "VERIFIED");
    const falsePass = DOMAIN_ENTITIES.flatMap((d) => d.constraints).concat(RELATIONSHIPS).filter((x) => x.verification === "VERIFIED" && !capVerified).length;
    return verdict(falsePass === 0, ev(CLASS.STATIC, "domainContract.js + capabilityRegister.js", { falselyVerified: falsePass }, { falselyVerified: 0 }, "Verification honesty check"));
  }),
  c("H04-006", "Physical domain entities match contract (documented only)", "No planned domain entity physically exists yet in Base44.", async (ctx) => {
    const probe = await ctx.entityProbe();
    const inconclusive = probe.filter((p) => p.state === "INCONCLUSIVE").map((p) => p.plannedName);
    if (inconclusive.length) return blockedResult(ev(CLASS.LIVE_RUNTIME, "entity probe", { inconclusive }, "404 per absent entity", "Probe inconclusive"));
    const present = probe.filter((p) => p.state === "PRESENT").map((p) => p.plannedName);
    return verdict(present.length === 0 && DOMAIN_ENTITIES.every((d) => !d.physicallyCreated), ev(CLASS.LIVE_RUNTIME, "Base44 entity probe (list limit 1)", { probed: probe.length, present }, { present: [] }, "Live platform probe"));
  }, { runnerType: RUNNER.BACKEND, classification: CLASS.LIVE_RUNTIME }),
];
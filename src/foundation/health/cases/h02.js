import { SOURCE_INVENTORY, AUTHORITY_TABLE, REQUIRED_AUTHORITY_DOMAINS, LOGICAL_SOURCE_COUNT, UIUX_CONTINUITY, physicalAttachmentCount } from "@/foundation/sourceInventory";
import { checkSplitSource, checkUiuxTables, uiuxTablesInput } from "@/foundation/inspection/sourceIntegrity";
import { OPEN_DECISIONS } from "@/foundation/openDecisions";
import { CLASS, STATUS } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H02");

export const H02_CASES = [
  c("H02-001", "All canonical MD files exist", "The 13 canonical docs exist under docs/shinka/.", async (ctx) => {
    const r = (await ctx.inspection()).docs;
    return verdict(r.missing.length === 0, ev(CLASS.STATIC, "docs/shinka/*.md", { present: r.present, missing: r.missing }, { present: 13, missing: [] }, "Doc file inspection"));
  }),
  c("H02-002", "Canonical MD headers and BuildMarker aligned", "Every doc has the standard header; Current BuildMarker equals the canonical marker.", async (ctx) => {
    const r = (await ctx.inspection()).docs;
    return verdict(r.headerGaps.length === 0 && r.misaligned.length === 0, ev(CLASS.STATIC, "docs/shinka/*.md headers", { headerGaps: r.headerGaps, misaligned: r.misaligned }, { headerGaps: [], misaligned: [] }, "Header inspection"));
  }),
  c("H02-003", "Source inventory registers 10 LOGICAL sources", "Inventory contains 10 unique logical sources with version, date, domain and authority (physical parts are not logical sources).", async () => {
    const ids = new Set(SOURCE_INVENTORY.map((s) => s.id));
    const complete = SOURCE_INVENTORY.every((s) => s.file && s.version && s.date && s.domain && s.authority && s.status);
    return verdict(SOURCE_INVENTORY.length === LOGICAL_SOURCE_COUNT && ids.size === LOGICAL_SOURCE_COUNT && complete, ev(CLASS.STATIC, "src/foundation/sourceInventory.js", { logical: SOURCE_INVENTORY.length, unique: ids.size, complete, physical: physicalAttachmentCount() }, { logical: 10, unique: 10, complete: true }, "Logical inventory inspection"));
  }),
  c("H02-004", "All logical sources and physical parts read", "Each logical source is READ and, where split, every physical part is READ.", async () => {
    const notRead = SOURCE_INVENTORY.filter((s) => s.status !== "READ").map((s) => s.file);
    const partsNotRead = SOURCE_INVENTORY.flatMap((s) => (s.parts || []).filter((p) => p.status !== "READ").map((p) => p.file));
    const ok = !notRead.length && !partsNotRead.length;
    const e = ev(ok ? CLASS.STATIC : CLASS.BLOCKED_EXTERNAL, "src/foundation/sourceInventory.js", { logicalRead: LOGICAL_SOURCE_COUNT - notRead.length, notRead, partsNotRead }, { logicalRead: 10, notRead: [], partsNotRead: [] },
      ok ? "SOURCE_RECEIVED_AND_RECORDED; original artifacts are external, not hash-verified in Git" : "Required source/part not supplied");
    return verdict(ok, e, STATUS.BLOCKED);
  }),
  c("H02-005", "Source authority table exists", "Every required domain has a registered primary source; DB v1.2 supersedes DB v1.1.", async () => {
    const ids = SOURCE_INVENTORY.map((s) => s.id);
    const uncovered = REQUIRED_AUTHORITY_DOMAINS.filter((d) => !AUTHORITY_TABLE.find((a) => a.domain === d && ids.includes(a.primary)));
    const dbRule = AUTHORITY_TABLE.find((a) => a.domain === "DATA_MODEL")?.primary === "SRC-05" && /SUPERSEDED/.test(SOURCE_INVENTORY.find((s) => s.id === "SRC-06").authority);
    return verdict(uncovered.length === 0 && dbRule, ev(CLASS.STATIC, "AUTHORITY_TABLE", { uncovered, dbV12Wins: dbRule }, { uncovered: [], dbV12Wins: true }, "Authority inspection"));
  }),
  c("H02-006", "No unresolved conflict silently marked resolved", "Resolved decisions cite a rule; OPEN decisions carry impact and are listed in SOURCE_OF_TRUTH.md.", async (ctx) => {
    const doc = (await ctx.inspection()).docs;
    const badResolved = OPEN_DECISIONS.filter((d) => d.status.startsWith("RESOLVED") && !d.resolution_rule).map((d) => d.id);
    const badOpen = OPEN_DECISIONS.filter((d) => d.status === "OPEN" && (!d.impact || !d.recommendation)).map((d) => d.id);
    const undocumented = doc.undocumentedDecisions;
    return verdict(!badResolved.length && !badOpen.length && !undocumented.length, ev(CLASS.STATIC, "openDecisions.js + SHINKA_SOURCE_OF_TRUTH.md", { badResolved, badOpen, undocumented }, { badResolved: [], badOpen: [], undocumented: [] }, `${OPEN_DECISIONS.length} decisions inspected`));
  }),
  c("H02-007", "Split UI/UX source reconstructed completely", "UI/UX v1.1 = 1 logical source in 4 physical parts: all registered, read, ordered 1→2→3→4, no gap/duplicate, continuity recorded, sole UI/UX authority; machine-readable companion registered as supporting artifact (not a logical source).", async (ctx) => {
    const r = checkSplitSource(SOURCE_INVENTORY, AUTHORITY_TABLE, UIUX_CONTINUITY);
    const doc = (await ctx.inspection()).docs;
    const documented = doc.splitDocumented;
    return verdict(r.ok && documented, ev(CLASS.STATIC, "sourceInventory.js + SHINKA_SOURCE_OF_TRUTH.md", { ...r, documented, boundaries: UIUX_CONTINUITY.boundaries }, { ok: true, documented: true, partCount: 4, companionPresent: true, companionAsLogicalSource: 0, logicalCount: 10 }, "Logical/physical source integrity by role"));
  }),
  c("H02-008", "UI/UX tables machine-readable (OD-010)", "All 11 UI/UX v1.1 tables represented via the SRC-03 companion: design table = implemented tokens, icon table = nav contract, 5 copy/state groups non-empty, QA checklist complete, logical count unchanged; OD-010 closed.", async (ctx) => {
    const r = checkUiuxTables(uiuxTablesInput());
    const od = OPEN_DECISIONS.find((d) => d.id === "OD-010");
    const doc = (await ctx.inspection()).docs;
    const documented = doc.companionDocumented;
    return verdict(r.ok && od?.status.startsWith("RESOLVED") && documented, ev(CLASS.STATIC, "uiuxTables.js + designTokens.js + uiContract.js + openDecisions.js", { ...r, od010: od?.status, documented }, { ok: true, tableCount: 11, od010: "RESOLVED_*", documented: true }, "Companion table completeness"));
  }),
];

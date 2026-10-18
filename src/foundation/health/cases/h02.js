import { BUILD_MARKER } from "@/foundation/buildMarker";
import { SOURCE_INVENTORY, AUTHORITY_TABLE, REQUIRED_AUTHORITY_DOMAINS, LOGICAL_SOURCE_COUNT, EXPECTED_UIUX_PARTS, UIUX_CONTINUITY, physicalAttachmentCount } from "@/foundation/sourceInventory";
import { checkSplitSource } from "@/foundation/inspection/sourceIntegrity";
import { OPEN_DECISIONS } from "@/foundation/openDecisions";
import { checkDocs } from "@/foundation/inspection/docRules";
import { CLASS, STATUS } from "../constants";
import { ev, verdict } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H02");

export const H02_CASES = [
  c("H02-001", "All canonical MD files exist", "The 12 canonical docs exist under docs/shinka/.", async (ctx) => {
    const r = checkDocs(await ctx.docs(), BUILD_MARKER);
    return verdict(r.missing.length === 0, ev(CLASS.STATIC, "docs/shinka/*.md", { present: r.present, missing: r.missing }, { present: 12, missing: [] }, "Doc file inspection"));
  }),
  c("H02-002", "Canonical MD headers and BuildMarker aligned", "Every doc has the standard header; Current BuildMarker equals the canonical marker.", async (ctx) => {
    const r = checkDocs(await ctx.docs(), BUILD_MARKER);
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
      ok ? "All logical sources and parts read" : "Required source/part not supplied");
    return { status: ok ? STATUS.PASS : STATUS.BLOCKED, evidence: e };
  }),
  c("H02-005", "Source authority table exists", "Every required domain has a registered primary source; DB v1.2 supersedes DB v1.1.", async () => {
    const ids = SOURCE_INVENTORY.map((s) => s.id);
    const uncovered = REQUIRED_AUTHORITY_DOMAINS.filter((d) => !AUTHORITY_TABLE.find((a) => a.domain === d && ids.includes(a.primary)));
    const dbRule = AUTHORITY_TABLE.find((a) => a.domain === "DATA_MODEL")?.primary === "SRC-05" && /SUPERSEDED/.test(SOURCE_INVENTORY.find((s) => s.id === "SRC-06").authority);
    return verdict(uncovered.length === 0 && dbRule, ev(CLASS.STATIC, "AUTHORITY_TABLE", { uncovered, dbV12Wins: dbRule }, { uncovered: [], dbV12Wins: true }, "Authority inspection"));
  }),
  c("H02-006", "No unresolved conflict silently marked resolved", "Resolved decisions cite a rule; OPEN decisions carry impact and are listed in SOURCE_OF_TRUTH.md.", async (ctx) => {
    const doc = checkDocs(await ctx.docs(), BUILD_MARKER).byName["SHINKA_SOURCE_OF_TRUTH.md"] || "";
    const badResolved = OPEN_DECISIONS.filter((d) => d.status.startsWith("RESOLVED") && !d.resolution_rule).map((d) => d.id);
    const badOpen = OPEN_DECISIONS.filter((d) => d.status === "OPEN" && (!d.impact || !d.recommendation)).map((d) => d.id);
    const undocumented = OPEN_DECISIONS.filter((d) => !doc.includes(d.id)).map((d) => d.id);
    return verdict(!badResolved.length && !badOpen.length && !undocumented.length, ev(CLASS.STATIC, "openDecisions.js + SHINKA_SOURCE_OF_TRUTH.md", { badResolved, badOpen, undocumented }, { badResolved: [], badOpen: [], undocumented: [] }, `${OPEN_DECISIONS.length} decisions inspected`));
  }),
  c("H02-007", "Split UI/UX source reconstructed completely", "UI/UX v1.1 = 1 logical source in 4 physical parts: all registered, read, ordered 1→2→3→4, no gap/duplicate, continuity recorded, sole UI/UX authority; 13 physical files total.", async (ctx) => {
    const r = checkSplitSource(SOURCE_INVENTORY, AUTHORITY_TABLE, UIUX_CONTINUITY);
    const doc = checkDocs(await ctx.docs(), BUILD_MARKER).byName["SHINKA_SOURCE_OF_TRUTH.md"] || "";
    const documented = EXPECTED_UIUX_PARTS.every((n) => doc.includes(n)) && /Logical source count:\*\*\s*1\b/.test(doc);
    return verdict(r.ok && documented, ev(CLASS.STATIC, "sourceInventory.js + SHINKA_SOURCE_OF_TRUTH.md", { ...r, documented, boundaries: UIUX_CONTINUITY.boundaries }, { ok: true, documented: true, partCount: 4, physicalCount: 13, logicalCount: 10 }, "Logical/physical source integrity"));
  }),
];
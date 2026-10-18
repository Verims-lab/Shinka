import { BUILD_MARKER } from "@/foundation/buildMarker";
import { SOURCE_INVENTORY, AUTHORITY_TABLE, REQUIRED_AUTHORITY_DOMAINS } from "@/foundation/sourceInventory";
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
  c("H02-003", "Source inventory registers all 10 documents", "Inventory contains 10 unique source entries with version, date, domain and authority.", async () => {
    const ids = new Set(SOURCE_INVENTORY.map((s) => s.id));
    const complete = SOURCE_INVENTORY.every((s) => s.file && s.version && s.date && s.domain && s.authority && s.status);
    return verdict(SOURCE_INVENTORY.length === 10 && ids.size === 10 && complete, ev(CLASS.STATIC, "src/foundation/sourceInventory.js", { entries: SOURCE_INVENTORY.length, unique: ids.size, complete }, { entries: 10, unique: 10, complete: true }, "Inventory inspection"));
  }),
  c("H02-004", "All 10 source documents received and read", "Each registered authoritative source has been received and read.", async () => {
    const notRead = SOURCE_INVENTORY.filter((s) => s.status !== "READ").map((s) => s.file);
    const e = ev(notRead.length ? CLASS.BLOCKED_EXTERNAL : CLASS.STATIC, "src/foundation/sourceInventory.js", { read: 10 - notRead.length, notRead }, { read: 10, notRead: [] },
      notRead.length ? "Required source not supplied (see OD-001)" : "All sources read");
    return { status: notRead.length ? STATUS.BLOCKED : STATUS.PASS, evidence: e };
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
];
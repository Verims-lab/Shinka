import { CLASS, RUNNER, STATUS } from "../constants";
import { ev, verdict, blockedResult } from "../evidence";
import { makeCase } from "../caseFactory";

const c = makeCase("H05", { runnerType: RUNNER.BACKEND, classification: CLASS.LIVE_RUNTIME });
const SRC = "validateContentArtifacts (live, read-only)";

const withArtifacts = (fn) => async (ctx) => {
  let a;
  try { a = await ctx.artifacts(); } catch (e) {
    return blockedResult(ev(CLASS.LIVE_RUNTIME, SRC, e?.code || "UNAVAILABLE", "200 OK", "Backend artifact validation unavailable"));
  }
  return fn(a);
};
const check = (ok, actual, expected, reason) => verdict(ok, ev(CLASS.LIVE_RUNTIME, SRC, actual, expected, reason));

export const H05_CASES = [
  c("H05-001", "260 content workbook readable", "Workbook parses with 260 data rows.", withArtifacts((a) =>
    check(a.content260.readable && a.content260.rowCount === 260, { rows: a.content260.rowCount, first: a.content260.firstId, last: a.content260.lastId }, { rows: 260 }, "Parsed first sheet"))),
  c("H05-002", "Expected Pair-ID/content columns exist", "Pair ID, category and four TR/EN text columns are present.", withArtifacts((a) => {
    const missing = a.content260.columns.filter((x) => !x.present).map((x) => x.col);
    return check(missing.length === 0, { missing }, { missing: [] }, "Header check");
  })),
  c("H05-003", "Six approved categories reconcile", "Category set and counts (30/66/56/32/44/32) match İş Analizi v2.5; mappings use only these six.", withArtifacts((a) => {
    const actual = { mismatches: a.content260.categoryCountMismatches, unknown: a.content260.unknownCategories,
      m192Categories: a.mapping192.categoriesUsed.length, m240Categories: a.mapping240.categoriesUsed.length,
      invalid: a.mapping192.invalidValues.length + a.mapping240.invalidValues.length };
    return check(!actual.mismatches.length && !actual.unknown.length && actual.m192Categories === 6 && actual.m240Categories === 6 && actual.invalid === 0, actual, { mismatches: [], unknown: [], categories: 6, invalid: 0 }, "Category reconciliation");
  })),
  c("H05-004", "192 mapping artifact readable and complete", "192 rows covering 12 signs × 4 moon phases × 4 cycle phases.", withArtifacts((a) =>
    check(a.mapping192.rowCount === 192 && a.mapping192.missingCombinations === 0, { rows: a.mapping192.rowCount, missingCombinations: a.mapping192.missingCombinations }, { rows: 192, missingCombinations: 0 }, "Coverage check"))),
  c("H05-005", "240 mapping artifact readable and complete", "240 rows covering 12 × 4 × (4 + UNKNOWN); 48 UNKNOWN rows.", withArtifacts((a) =>
    check(a.mapping240.rowCount === 240 && a.mapping240.missingCombinations === 0 && a.mapping240.unknownRows === 48, { rows: a.mapping240.rowCount, missingCombinations: a.mapping240.missingCombinations, unknownRows: a.mapping240.unknownRows }, { rows: 240, missingCombinations: 0, unknownRows: 48 }, "Coverage check"))),
  c("H05-006", "192 + UNKNOWN extension relationship", "The 240 file equals the 192 file (same categories) plus 48 UNKNOWN rows.", withArtifacts((a) =>
    check(a.relation.relationshipHolds, a.relation, { relationshipHolds: true, differenceCount: 0 }, "Row-level comparison"))),
  c("H05-007", "No duplicate IDs or mappings", "Pair IDs unique and well-formed; mapping combinations unique.", withArtifacts((a) => {
    const actual = { dupPairIds: a.content260.duplicateIds, badIds: a.content260.badIdFormat, dup192: a.mapping192.duplicates, dup240: a.mapping240.duplicates };
    return check(Object.values(actual).every((v) => v.length === 0), actual, { all: [] }, "Duplicate detection");
  })),
  c("H05-008", "No missing mandatory language cells", "All TR and EN Your Shinka / Suggestion cells are filled.", withArtifacts((a) =>
    check(a.content260.missingCellCount === 0, { missingCellCount: a.content260.missingCellCount }, { missingCellCount: 0 }, "Cell completeness"))),
  c("H05-009", "No live content import performed", "Validator reports no import and content entities do not exist.", async (ctx) => {
    const probe = await ctx.entityProbe();
    const content = probe.filter((p) => ["MessagePair", "MessageCategoryMapping", "MessageCategoryLookup"].includes(p.plannedName));
    if (content.some((p) => p.state === "INCONCLUSIVE")) return { status: STATUS.BLOCKED, evidence: ev(CLASS.LIVE_RUNTIME, "entity probe", content, "ABSENT", "Probe inconclusive") };
    let importPerformed = null;
    try { importPerformed = (await ctx.artifacts()).importPerformed; } catch { importPerformed = null; }
    if (importPerformed === null) return blockedResult(ev(CLASS.LIVE_RUNTIME, SRC, "UNAVAILABLE", false, "Validator unavailable"));
    return check(importPerformed === false && content.every((p) => p.state === "ABSENT"), { importPerformed, contentEntities: content.map((p) => `${p.plannedName}:${p.state}`) }, { importPerformed: false, contentEntities: "ABSENT" }, "Import absence check");
  }),
];
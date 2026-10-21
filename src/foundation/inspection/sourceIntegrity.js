// Logical vs physical source integrity (pure). UI/UX v1.1 = ONE logical source in FOUR physical parts.
import { LOGICAL_SOURCE_COUNT, EXPECTED_UIUX_PARTS, physicalAttachmentCount, SOURCE_INVENTORY } from "@/foundation/sourceInventory";
import { UIUX_COMPANION, UIUX_TABLES, DESIGN_TABLE, ICON_TABLE, APPROVED_COPY, QA_CHECKLIST } from "@/foundation/uiuxTables";
import { DESIGN_TOKENS, UIUX_COLOR_AMENDMENTS } from "@/foundation/designTokens";
import { BOTTOM_NAV, PROFILE_ENTRY } from "@/foundation/uiContract";

const ITEM_KEYS = { home: "Home", calendar: "Calendar", pattern: "Pattern", you: "You" };
export const uiuxTablesInput = () => ({
  tables: UIUX_TABLES, design: DESIGN_TABLE, tokens: { colors: DESIGN_TOKENS.color }, icons: ICON_TABLE,
  iconMap: Object.fromEntries([...BOTTOM_NAV, PROFILE_ENTRY].map((n) => [ITEM_KEYS[n.key], n.lucide])),
  copy: APPROVED_COPY, qa: QA_CHECKLIST, companion: UIUX_COMPANION, logicalCount: SOURCE_INVENTORY.length,
});

export function checkSplitSource(inventory, authorityTable, continuity) {
  const ui = inventory.find((s) => s.id === "SRC-03");
  const parts = ui?.parts || [];
  const names = parts.map((p) => p.file);
  const orders = parts.map((p) => p.part);
  const r = {
    logicalCount: inventory.length,
    uniqueLogical: new Set(inventory.map((s) => s.id)).size,
    uiPresent: !!ui && ui.status === "READ",
    partCount: parts.length,
    missingParts: EXPECTED_UIUX_PARTS.filter((n) => !names.includes(n)),
    duplicateParts: names.filter((n, i) => names.indexOf(n) !== i),
    unreadParts: parts.filter((p) => p.status !== "READ").map((p) => p.file),
    orderValid: orders.join(",") === "1,2,3,4",
    partsAsLogicalSources: inventory.filter((s) => /Part_\d_of_\d/.test(s.file)).length,
    uiAuthority: authorityTable.find((a) => a.domain === "UI_UX_COPY_DESIGN")?.primary === "SRC-03",
    continuityVerified: !!continuity?.verified && continuity.sectionsCovered.length === 9 && continuity.duplicatedSections.length === 0,
    physicalCount: physicalAttachmentCount(inventory),
    companionPresent: (ui?.supportingArtifacts || []).some((a) => a.role === "MACHINE_READABLE_TABLE_COMPANION" && a.mirrors === "SRC-03" && a.status === "READ"),
    companionAsLogicalSource: inventory.filter((s) => /Companion/i.test(s.file)).length,
  };
  r.ok = r.logicalCount === LOGICAL_SOURCE_COUNT && r.uniqueLogical === LOGICAL_SOURCE_COUNT && r.uiPresent && r.partCount === 4 &&
    !r.missingParts.length && !r.duplicateParts.length && !r.unreadParts.length && r.orderValid && r.partsAsLogicalSources === 0 &&
    r.uiAuthority && r.continuityVerified && r.companionPresent && r.companionAsLogicalSource === 0;
  return r;
}

// OD-010: all 11 UI/UX tables represented machine-readably and consistent with the implemented contract.
export function checkUiuxTables(t) {
  const r = {
    tableCount: t.tables.length, emptyTables: t.tables.filter((x) => !x.rows).map((x) => x.n),
    colorsMatch: JSON.stringify({ ...t.design.colors, ...UIUX_COLOR_AMENDMENTS }) === JSON.stringify(t.tokens.colors),
    iconsMatch: t.icons.length === 4 && t.icons.every((i) => t.iconMap[i.item] === i.icon) && t.icons.find((i) => i.item === "You")?.placement === "TOP_RIGHT_PROFILE",
    copyGroups: Object.keys(t.copy), emptyCopyGroups: Object.entries(t.copy).filter(([, v]) => !v.length).map(([k]) => k),
    qaItems: t.qa.length, companionMirrorsSrc03: t.companion.mirrors === "SRC-03" && t.companion.visualReferenceRules.length >= 3,
    logicalCount: t.logicalCount,
  };
  r.ok = r.tableCount === 11 && !r.emptyTables.length && r.colorsMatch && r.iconsMatch && r.copyGroups.length === 5 && !r.emptyCopyGroups.length &&
    r.qaItems >= 16 && r.companionMirrorsSrc03 && r.logicalCount === LOGICAL_SOURCE_COUNT;
  return r;
}
// Logical vs physical source integrity (pure). UI/UX v1.1 = ONE logical source in FOUR physical parts.
import { LOGICAL_SOURCE_COUNT, EXPECTED_UIUX_PARTS, physicalAttachmentCount } from "@/foundation/sourceInventory";

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
  };
  r.ok = r.logicalCount === LOGICAL_SOURCE_COUNT && r.uniqueLogical === LOGICAL_SOURCE_COUNT && r.uiPresent && r.partCount === 4 &&
    !r.missingParts.length && !r.duplicateParts.length && !r.unreadParts.length && r.orderValid && r.partsAsLogicalSources === 0 &&
    r.uiAuthority && r.continuityVerified && r.physicalCount === 13;
  return r;
}
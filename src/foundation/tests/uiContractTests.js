// UI/UX reconciliation tests: UI/UX v1.1 split-source reconciliation + UI contract.
import { BUILD_MARKER } from "@/foundation/buildMarker";
import { BUILD_LEDGER } from "@/foundation/buildLedger";
import { SOURCE_INVENTORY, AUTHORITY_TABLE, LOGICAL_SOURCE_COUNT, EXPECTED_UIUX_PARTS, UIUX_CONTINUITY, physicalAttachmentCount } from "@/foundation/sourceInventory";
import { checkSplitSource, checkUiuxTables, uiuxTablesInput } from "@/foundation/inspection/sourceIntegrity";
import { checkAuthPolicy } from "@/foundation/authPolicy";
import { checkNavContract, findDarkVariants } from "@/foundation/inspection/uiRules";
import { BOTTOM_NAV, PROFILE_ENTRY } from "@/foundation/uiContract";
import { DESIGN_TOKENS } from "@/foundation/designTokens";
import { iconExports } from "@/foundation/probes/iconProbe";
import { loadSources, loadDocs } from "@/foundation/inspection/sourceScanner";
import { findLegacyImports } from "@/foundation/inspection/sourceRules";
import { checkDocs } from "@/foundation/inspection/docRules";
import { findUnlabeledControls, probeMobileOverflow } from "@/foundation/probes/domProbes";
import { HEALTH_CATALOG_VERSION } from "@/foundation/health/constants";

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const uiParts = () => SOURCE_INVENTORY.find((s) => s.id === "SRC-03")?.parts || [];
const split = (inv) => checkSplitSource(inv, AUTHORITY_TABLE, UIUX_CONTINUITY);
const COLORS = { primaryPlum: "#6F415A", deepPlumText: "#4C263F", mutedMauve: "#93637B", dustyRose: "#D8A5AA", blushPink: "#F2D7D4", softLavender: "#E7DCE8", warmIvory: "#FFF8F3", softCream: "#F9EEE8", mutedTaupe: "#87757D", divider: "#EDE3E3", white: "#FFFFFF" };

export const UI_CONTRACT_TESTS = [
  ["T26", "Logical source count = 10", () => assert(SOURCE_INVENTORY.length === LOGICAL_SOURCE_COUNT && LOGICAL_SOURCE_COUNT === 10, "logical count")],
  ["T27", "Physical UI/UX parts = 4", () => assert(uiParts().length === 4, "part count")],
  ["T28", "All four UI/UX parts present and read", () => assert(EXPECTED_UIUX_PARTS.every((n) => uiParts().some((p) => p.file === n && p.status === "READ")), "part missing/unread")],
  ["T29", "Part order valid (reversed order detected)", () => {
    assert(uiParts().map((p) => p.part).join() === "1,2,3,4", "order");
    const bad = SOURCE_INVENTORY.map((s) => (s.id === "SRC-03" ? { ...s, parts: [...s.parts].reverse() } : s));
    assert(!split(bad).orderValid, "reversed order accepted");
  }],
  ["T30", "UI/UX logical source authority valid", () => assert(AUTHORITY_TABLE.find((a) => a.domain === "UI_UX_COPY_DESIGN").primary === "SRC-03" && split(SOURCE_INVENTORY).ok, "authority")],
  ["T31", "UI/UX not counted as four logical sources", () => {
    assert(!SOURCE_INVENTORY.some((s) => /Part_\d_of_\d/.test(s.file)) && physicalAttachmentCount() === 14, "parts counted as logical");
    assert(!split([...SOURCE_INVENTORY, { id: "SRC-11", file: EXPECTED_UIUX_PARTS[0] }]).ok, "inflated inventory accepted");
  }],
  ["T32", "Design colors exact", () => assert(JSON.stringify(DESIGN_TOKENS.color) === JSON.stringify(COLORS), "colors")],
  ["T33", "Typography contract exact", () => {
    const ty = DESIGN_TOKENS.typography;
    assert(/Cormorant Garamond/.test(ty.heading) && /Inter/.test(ty.body) && ty.headingWeight === 500 && ty.bodyWeight === 400 && ty.labelWeight === 500, "families/weights");
    assert(JSON.stringify(ty.headingSizes) === "[[34,40],[28,34],[24,30],[20,26]]" && JSON.stringify(ty.bodySizes) === "[[17,25],[15,22],[13,18]]", "sizes");
  }],
  ["T34", "Icon contract exact", () => assert(checkNavContract(iconExports()).ok, "icons")],
  ["T35", "Bottom navigation = Home/Calendar/Pattern", () => assert(BOTTOM_NAV.map((n) => n.key).join() === "home,calendar,pattern", "nav")],
  ["T36", "You is not a bottom-nav item", () => assert(!BOTTOM_NAV.some((n) => n.key === "you") && PROFILE_ENTRY.placement === "top-right" && PROFILE_ENTRY.touchTarget === 44, "you in nav")],
  ["T37", "Touch target contract 44", () => assert(DESIGN_TOKENS.touchTargetMin === 44, "touch")],
  ["T38", "Primary control geometry contract", () => {
    const k = DESIGN_TOKENS.control;
    assert(k.primaryMinHeight === 52 && k.inputMinHeight === 52 && k.inputPaddingX === 16 && k.primaryRadius === 16 && k.disabledOpacity === 0.45 && DESIGN_TOKENS.pagePaddingX === 20, "geometry");
    assert(JSON.stringify(DESIGN_TOKENS.spacing) === "[4,8,12,16,20,24,32,40]" && JSON.stringify(DESIGN_TOKENS.radii) === '{"sm":12,"md":16,"lg":20,"pill":999}', "scale");
  }],
  ["T39", "No dark-theme target", async () => assert(DESIGN_TOKENS.theme === "light-only" && findDarkVariants(await loadSources(), ["/src/components/shinka/", "/src/pages/Home.jsx"]).length === 0, "dark target")],
  ["T40", "Icon-only controls require accessible labels", () => {
    const d = document.createElement("div");
    const btn = document.createElement("button");
    btn.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
    d.appendChild(btn);
    document.body.appendChild(d);
    const found = findUnlabeledControls(d).length;
    d.remove();
    assert(found === 1, "unlabeled icon-only fixture not detected");
  }],
  ["T41", "Build & Environment has no horizontal overflow at 360px", async () => {
    const p = await probeMobileOverflow("/internal/build?probe=1", 360, 15000);
    assert(p.state === "MEASURED" && !p.overflow, `probe ${p.state} sw=${p.scrollWidth}`);
  }],
  ["T42", "SHINKA_UI_UX_STANDARDS BuildMarker aligned", async () => assert(!checkDocs(await loadDocs(), BUILD_MARKER).misaligned.some((m) => m.doc === "SHINKA_UI_UX_STANDARDS.md"), "ui/ux doc misaligned")],
  ["T43", "No legacy UI import", async () => {
    const ui = Object.fromEntries(Object.entries(await loadSources()).filter(([p]) => /\/src\/(components|pages)\//.test(p)));
    assert(findLegacyImports(ui).length === 0, "legacy UI import");
  }],
  ["T44", "Health BuildMarker / catalog synchronization", () => {
    const last = BUILD_LEDGER[BUILD_LEDGER.length - 1];
    assert(last.build_marker === BUILD_MARKER && last.health_catalog_version === HEALTH_CATALOG_VERSION, "marker/catalog out of sync");
  }],
  ["T45", "Build History records each package exactly once", async () => {
    const hist = checkDocs(await loadDocs(), BUILD_MARKER).byName["SHINKA_BUILD_HISTORY.md"] || "";
    const bad = BUILD_LEDGER.filter((e) => hist.split(`## ${e.build_marker} — ${e.package_name}`).length !== 2).map((e) => e.build_marker);
    assert(!bad.length, `history mismatch: ${bad.join(",")}`);
  }],
  ["T46", "All 11 UI/UX tables machine-readable and consistent", () => {
    const r = checkUiuxTables(uiuxTablesInput());
    assert(r.ok, `tables: ${JSON.stringify(r)}`);
  }],
  ["T47", "Companion is a supporting artifact, not a logical source", () => {
    const r = split(SOURCE_INVENTORY);
    assert(r.companionPresent && r.companionAsLogicalSource === 0 && SOURCE_INVENTORY.length === 10, "companion modelled as logical source");
  }],
  ["T48", "Auth policy detects unapproved methods", () => {
    assert(!checkAuthPolicy({ methods: ["password", "google"] }).ok && checkAuthPolicy({ methods: ["apple", "google"] }).ok, "auth policy check");
  }],
];
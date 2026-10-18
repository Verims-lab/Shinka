// Internal source inventory — LOGICAL sources (10). A logical source may be transported as several PHYSICAL parts
// (attachment-size constraint only). Parts never create separate domains, precedence or rules.
import { UIUX_COMPANION } from "@/foundation/uiuxTables";
export const SOURCE_SET_VERSION = "SRC-2026-10-18";
export const LOGICAL_SOURCE_COUNT = 10;
const BASE = "https://media.base44.com/files/public/user_69e753d0c5569af165ec5898/";
const UI_BASE = "https://media.base44.com/files/public/6ad5190f4845d4e3af03b420/";

export const EXPECTED_UIUX_PARTS = Object.freeze([
  "Shinka_UI_UX_v1.1_Part_1_of_4.docx", "Shinka_UI_UX_v1.1_Part_2_of_4.docx",
  "Shinka_UI_UX_v1.1_Part_3_of_4.docx", "Shinka_UI_UX_v1.1_Part_4_of_4.docx",
]);

const UIUX_PARTS = Object.freeze([
  { part: 1, file: EXPECTED_UIUX_PARTS[0], status: "READ", originalPages: "1–5", firstSection: "Title / usage note / ToC", lastSection: "ON-02", url: UI_BASE + "12335d0d0_Shinka_UI_UX_v11_Part_1_of_4.docx" },
  { part: 2, file: EXPECTED_UIUX_PARTS[1], status: "READ", originalPages: "6–9", firstSection: "ON-03", lastSection: "ON-06", url: UI_BASE + "540d6602a_Shinka_UI_UX_v11_Part_2_of_4.docx" },
  { part: 3, file: EXPECTED_UIUX_PARTS[2], status: "READ", originalPages: "10–16", firstSection: "§4 Home", lastSection: "§7.3 Account & Privacy", url: UI_BASE + "b5a9602cc_Shinka_UI_UX_v11_Part_3_of_4.docx" },
  { part: 4, file: EXPECTED_UIUX_PARTS[3], status: "READ", originalPages: "17–21", firstSection: "§7.4 Withdraw consent", lastSection: "§9 Checklist", url: UI_BASE + "e0c4b8ace_Shinka_UI_UX_v11_Part_4_of_4.docx" },
]);

// Continuity verified by reading parts in order 1→2→3→4 (recorded decision, UI/UX reconciliation package).
export const UIUX_CONTINUITY = Object.freeze({
  verified: true,
  boundaries: ["P1 ends ON-02 → P2 starts ON-03", "P2 ends ON-06 → P3 starts §4 Home", "P3 ends §7.3 → P4 starts §7.4"],
  sectionsCovered: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  duplicatedSections: [],
});

export const SOURCE_INVENTORY = Object.freeze([
  { id: "SRC-01", file: "Shinka_Is_Analizi_v2.5_Tutarli.docx", version: "2.5", date: "2026-10-18", domain: "BUSINESS_BEHAVIOR", authority: "PRIMARY", status: "READ", url: BASE + "bc0239b25_Shinka_Is_Analizi_v25_Tutarli.docx" },
  { id: "SRC-02", file: "Shinka_Use_Case_v1.4_Tutarli.docx", version: "1.4", date: "2026-10-18", domain: "USER_SYSTEM_FLOWS", authority: "PRIMARY", status: "READ", url: BASE + "0bb796ff4_Shinka_Use_Case_v14_Tutarli.docx" },
  { id: "SRC-03", file: "Shinka_UI_UX_Tasarim_v1.1_Tutarli.docx", version: "1.1", date: "2026-10-18", domain: "UI_UX_COPY_DESIGN", authority: "PRIMARY", status: "READ", url: null, transport: "SPLIT_4_PARTS", parts: UIUX_PARTS, supportingArtifacts: [UIUX_COMPANION] },
  { id: "SRC-04", file: "Shinka_Teknik_Analiz_v1.1_Tutarli.docx", version: "1.1", date: "2026-10-18", domain: "TECHNICAL_ARCHITECTURE", authority: "PRIMARY", status: "READ", url: BASE + "0c4a2c9af_Shinka_Teknik_Analiz_v11_Tutarli.docx" },
  { id: "SRC-05", file: "Shinka_Veritabani_Tasarim_v1.2_Tutarli.docx", version: "1.2", date: "2026-10-18", domain: "DATA_MODEL", authority: "PRIMARY", status: "READ", url: BASE + "9e2fd5f9c_Shinka_Veritabani_Tasarim_v12_Tutarli.docx" },
  { id: "SRC-06", file: "Shinka_DB_v1_1.docx", version: "1.1", date: "2026-10-18", domain: "DATA_MODEL", authority: "SUPPORTING_SUPERSEDED_BY_SRC-05", status: "READ", url: BASE + "d779ec9fb_Shinka_DB_v1_1.docx" },
  { id: "SRC-07", file: "Shinka_Veritabani_Entity_Iliskiler_v1.2.xlsx", version: "1.2", date: "2026-10-18", domain: "DATA_MODEL", authority: "PRIMARY", status: "READ", url: BASE + "518a929d2_Shinka_Veritabani_Entity_Iliskiler_v12.xlsx" },
  { id: "SRC-08", file: "Shinka_Free_260_YS_Suggestion_TR_EN.xlsx", version: "—", date: "2026-10-18", domain: "CONTENT_COPY", authority: "PRIMARY", status: "READ", url: BASE + "ecd0da43a_Shinka_Free_260_YS_Suggestion_TR_EN.xlsx" },
  { id: "SRC-09", file: "Shinka_Free_240_Eslestirme_40Gun_Test_Sade.xlsx", version: "—", date: "2026-10-18", domain: "CONTENT_MAPPING", authority: "PRIMARY", status: "READ", url: BASE + "7ed24e941_Shinka_Free_240_Eslestirme_40Gun_Test_Sade.xlsx" },
  { id: "SRC-10", file: "Shinka_Free_192_Kategori_Eslestirme.xlsx", version: "—", date: "2026-10-18", domain: "CONTENT_MAPPING", authority: "SUPPORTING (subset of SRC-09)", status: "READ", url: BASE + "b761510d9_Shinka_Free_192_Kategori_Eslestirme.xlsx" },
]);

// Physical artifacts by role: transport parts (or the single file) + supporting artifacts (e.g. machine-readable companion).
export const physicalAttachmentCount = (inv = SOURCE_INVENTORY) => inv.reduce((n, s) => n + (s.parts?.length || 1) + (s.supportingArtifacts?.length || 0), 0);

export const REQUIRED_AUTHORITY_DOMAINS = [
  "BUSINESS_BEHAVIOR", "USER_SYSTEM_FLOWS", "UI_UX_COPY_DESIGN", "TECHNICAL_ARCHITECTURE", "DATA_MODEL", "CONTENT_COPY", "CONTENT_MAPPING",
];

export const AUTHORITY_TABLE = Object.freeze([
  { domain: "BUSINESS_BEHAVIOR", primary: "SRC-01", supporting: [] },
  { domain: "USER_SYSTEM_FLOWS", primary: "SRC-02", supporting: ["SRC-01"] },
  { domain: "UI_UX_COPY_DESIGN", primary: "SRC-03", supporting: [] },
  { domain: "TECHNICAL_ARCHITECTURE", primary: "SRC-04", supporting: ["SRC-05"] },
  { domain: "DATA_MODEL", primary: "SRC-05", supporting: ["SRC-07", "SRC-06"] },
  { domain: "CONTENT_COPY", primary: "SRC-08", supporting: [] },
  { domain: "CONTENT_MAPPING", primary: "SRC-09", supporting: ["SRC-10"] },
]);
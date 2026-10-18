// Internal source inventory — the uploaded 2026-10-18 source set is the authority for this project.
export const SOURCE_SET_VERSION = "SRC-2026-10-18";
const BASE = "https://media.base44.com/files/public/user_69e753d0c5569af165ec5898/";

export const SOURCE_INVENTORY = Object.freeze([
  { id: "SRC-01", file: "Shinka_Is_Analizi_v2.5_Tutarli.docx", version: "2.5", date: "2026-10-18", domain: "BUSINESS_BEHAVIOR", authority: "PRIMARY", status: "READ", url: BASE + "bc0239b25_Shinka_Is_Analizi_v25_Tutarli.docx" },
  { id: "SRC-02", file: "Shinka_Use_Case_v1.4_Tutarli.docx", version: "1.4", date: "2026-10-18", domain: "USER_SYSTEM_FLOWS", authority: "PRIMARY", status: "READ", url: BASE + "0bb796ff4_Shinka_Use_Case_v14_Tutarli.docx" },
  { id: "SRC-03", file: "Shinka_UI_UX_Tasarim_v1.1_Tutarli.docx", version: "1.1", date: "2026-10-18", domain: "UI_UX_COPY_DESIGN", authority: "PRIMARY", status: "NOT_RECEIVED", url: null },
  { id: "SRC-04", file: "Shinka_Teknik_Analiz_v1.1_Tutarli.docx", version: "1.1", date: "2026-10-18", domain: "TECHNICAL_ARCHITECTURE", authority: "PRIMARY", status: "READ", url: BASE + "0c4a2c9af_Shinka_Teknik_Analiz_v11_Tutarli.docx" },
  { id: "SRC-05", file: "Shinka_Veritabani_Tasarim_v1.2_Tutarli.docx", version: "1.2", date: "2026-10-18", domain: "DATA_MODEL", authority: "PRIMARY", status: "READ", url: BASE + "9e2fd5f9c_Shinka_Veritabani_Tasarim_v12_Tutarli.docx" },
  { id: "SRC-06", file: "Shinka_DB_v1_1.docx", version: "1.1", date: "2026-10-18", domain: "DATA_MODEL", authority: "SUPPORTING_SUPERSEDED_BY_SRC-05", status: "READ", url: BASE + "d779ec9fb_Shinka_DB_v1_1.docx" },
  { id: "SRC-07", file: "Shinka_Veritabani_Entity_Iliskiler_v1.2.xlsx", version: "1.2", date: "2026-10-18", domain: "DATA_MODEL", authority: "PRIMARY", status: "READ", url: BASE + "518a929d2_Shinka_Veritabani_Entity_Iliskiler_v12.xlsx" },
  { id: "SRC-08", file: "Shinka_Free_260_YS_Suggestion_TR_EN.xlsx", version: "—", date: "2026-10-18", domain: "CONTENT_COPY", authority: "PRIMARY", status: "READ", url: BASE + "ecd0da43a_Shinka_Free_260_YS_Suggestion_TR_EN.xlsx" },
  { id: "SRC-09", file: "Shinka_Free_240_Eslestirme_40Gun_Test_Sade.xlsx", version: "—", date: "2026-10-18", domain: "CONTENT_MAPPING", authority: "PRIMARY", status: "READ", url: BASE + "7ed24e941_Shinka_Free_240_Eslestirme_40Gun_Test_Sade.xlsx" },
  { id: "SRC-10", file: "Shinka_Free_192_Kategori_Eslestirme.xlsx", version: "—", date: "2026-10-18", domain: "CONTENT_MAPPING", authority: "SUPPORTING (subset of SRC-09)", status: "READ", url: BASE + "b761510d9_Shinka_Free_192_Kategori_Eslestirme.xlsx" },
]);

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
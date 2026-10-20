// OD-002: exact user approval, 2026-10-20 (Europe/Istanbul), in this conversation.
// Codes and EN display names come from that decision, not the original workbooks.
// Source labels and TR display names are preserved; no Pair/mapping copy changes.
export const CONTENT_CATEGORY_DECISION = Object.freeze({
  decision_id: 'OD-002',
  status: 'APPROVED_PRODUCT_DECISION',
  resolution_status: 'RESOLVED_BY_PRODUCT_DECISION',
  approved_on: '2026-10-20',
  source: 'Explicit user approval of the six-row category table in this conversation',
  rows: Object.freeze([
    { source_label: 'Dinlenme & Yavaşlama', category_code: 'REST_AND_SLOW_DOWN', display_name_tr: 'Kendine Bir Nefes', display_name_en: 'Take a Breath' },
    { source_label: 'Öz Bakım & İyi Hissetme', category_code: 'SELF_CARE_AND_WELLBEING', display_name_tr: 'Kendine İyi Gel', display_name_en: 'Be Kind to Yourself' },
    { source_label: 'Yenilik & Keşif', category_code: 'NOVELTY_AND_DISCOVERY', display_name_tr: 'Yeniye Yer Aç', display_name_en: 'Make Room for the New' },
    { source_label: 'Odaklanma & İlerleme', category_code: 'FOCUS_AND_PROGRESS', display_name_tr: 'Küçük Adımlarla İlerle', display_name_en: 'Move Forward in Small Steps' },
    { source_label: 'Bağ Kurma & Paylaşım', category_code: 'CONNECTION_AND_SHARING', display_name_tr: 'Bağlarını Güçlendir', display_name_en: 'Strengthen Your Connections' },
    { source_label: 'Sadeleşme & Bırakma', category_code: 'SIMPLICITY_AND_LETTING_GO', display_name_tr: 'Hafiflemeye İzin Ver', display_name_en: 'Allow Yourself to Feel Lighter' },
  ].map(row => Object.freeze(row))),
});

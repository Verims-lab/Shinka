// Single implementation of Shinka content-artifact integrity validation (read-only).
// Returns counts, IDs and booleans only — never message bodies.

export const CONTENT_COLUMNS = ["Pair ID", "Mesaj kategorisi", "Your Shinka (TR)", "Today’s Suggestion (TR)", "Your Shinka (EN)", "Today’s Suggestion (EN)"];
export const MAPPING_COLUMNS = ["Burç", "Ay Fazı", "Döngü evresi", "Mesaj kategorisi"];

// Approved category counts — İş Analizi v2.5 §6.
export const CATEGORY_COUNTS = {
  "Dinlenme & Yavaşlama": 30,
  "Öz Bakım & İyi Hissetme": 66,
  "Yenilik & Keşif": 56,
  "Odaklanma & İlerleme": 32,
  "Bağ Kurma & Paylaşım": 44,
  "Sadeleşme & Bırakma": 32,
};
export const SIGNS = ["Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak", "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık"];
export const MOONS = ["Yeni Ay", "Büyüyen Ay (Hilal)", "Dolunay", "Küçülen Ay"];
export const PHASES = ["Menstrüel", "Foliküler", "Ovulasyon", "Luteal"];
export const UNKNOWN_PHASE = "Bilinmiyor";

const norm = (s) => String(s ?? "").trim();
const headerMatches = (header, expected) =>
  expected.map((col) => ({ col, present: header.map(norm).includes(col) }));

export function validateContentRows(rows) {
  const header = rows[0] || [];
  const body = rows.slice(1);
  const columns = headerMatches(header, CONTENT_COLUMNS);
  const idx = CONTENT_COLUMNS.map((c) => header.map(norm).indexOf(c));
  const seen = new Map();
  const duplicateIds = [];
  const missingCells = [];
  const badIdFormat = [];
  const perCategory = {};
  const unknownCategories = new Set();
  body.forEach((r, i) => {
    const id = norm(r[idx[0]]);
    if (!/^SHF-\d{3}$/.test(id)) badIdFormat.push(id || `row${i + 2}`);
    if (seen.has(id)) duplicateIds.push(id); else seen.set(id, true);
    idx.forEach((ci, k) => { if (ci < 0 || norm(r[ci]) === "") missingCells.push({ pairId: id || `row${i + 2}`, column: CONTENT_COLUMNS[k] }); });
    const cat = norm(r[idx[1]]);
    perCategory[cat] = (perCategory[cat] || 0) + 1;
    if (!(cat in CATEGORY_COUNTS)) unknownCategories.add(cat);
  });
  const categoryCountMismatches = Object.entries(CATEGORY_COUNTS)
    .filter(([c, n]) => (perCategory[c] || 0) !== n)
    .map(([c, n]) => ({ category: c, expected: n, actual: perCategory[c] || 0 }));
  return {
    rowCount: body.length, columns, duplicateIds, missingCells: missingCells.slice(0, 50), missingCellCount: missingCells.length,
    badIdFormat, perCategory, unknownCategories: [...unknownCategories], categoryCountMismatches,
    firstId: norm(body[0]?.[idx[0]]), lastId: norm(body[body.length - 1]?.[idx[0]]),
  };
}

export function validateMappingRows(rows, includeUnknown) {
  const header = rows[0] || [];
  const body = rows.slice(1);
  const columns = headerMatches(header, MAPPING_COLUMNS);
  const idx = MAPPING_COLUMNS.map((c) => header.map(norm).indexOf(c));
  const phases = includeUnknown ? [...PHASES, UNKNOWN_PHASE] : PHASES;
  const keys = new Map();
  const duplicates = [];
  const invalidValues = [];
  const missingCategory = [];
  const categoriesUsed = new Set();
  let unknownRows = 0;
  body.forEach((r, i) => {
    const [s, m, p, c] = idx.map((ci) => norm(r[ci]));
    const key = `${s}|${m}|${p}`;
    if (!SIGNS.includes(s) || !MOONS.includes(m) || !phases.includes(p)) invalidValues.push(`row${i + 2}`);
    if (!c) missingCategory.push(`row${i + 2}`);
    else if (!(c in CATEGORY_COUNTS)) invalidValues.push(`row${i + 2}:category`);
    if (keys.has(key)) duplicates.push(key); else keys.set(key, c);
    if (p === UNKNOWN_PHASE) unknownRows++;
    if (c) categoriesUsed.add(c);
  });
  let missingCombinations = 0;
  for (const s of SIGNS) for (const m of MOONS) for (const p of phases) if (!keys.has(`${s}|${m}|${p}`)) missingCombinations++;
  return {
    rowCount: body.length, expectedRows: SIGNS.length * MOONS.length * phases.length, columns,
    duplicates, invalidValues, missingCategory, missingCombinations, unknownRows,
    categoriesUsed: [...categoriesUsed], _keys: keys,
  };
}

export function compareBaseAndExtended(base, extended) {
  let baseRowsMatching = 0;
  const differences = [];
  for (const [key, cat] of base._keys) {
    if (extended._keys.get(key) === cat) baseRowsMatching++; else differences.push(key);
  }
  const extendedNonUnknown = [...extended._keys.keys()].filter((k) => !k.endsWith(`|${UNKNOWN_PHASE}`)).length;
  return {
    baseRowsMatching, differences: differences.slice(0, 50), differenceCount: differences.length,
    extendedNonUnknown, unknownRows: extended.unknownRows,
    relationshipHolds: differences.length === 0 && extendedNonUnknown === base._keys.size && extended.unknownRows === 48 && base._keys.size === 192,
  };
}

export const stripInternal = ({ _keys, ...rest }) => rest;
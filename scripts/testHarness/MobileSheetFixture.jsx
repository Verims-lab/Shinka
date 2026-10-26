import BirthplaceCombobox from '@/features/profile/BirthplaceCombobox';
// Synthetic paged search results for mobile combobox checks (no provider).
const request = async (action, payload) => {
  window.__sheetCalls ||= []; window.__sheetCalls.push({ action, page: payload.page || 0 });
  const page = payload.page || 0;
  const places = Array.from({ length: 50 }, (_, i) => ({ birthplace_geonames_id: 1000 + page * 50 + i, birthplace_name: `Uzun Kan yerleşim adı ${page * 50 + i}`, birthplace_country_code: 'TR', birthplace_latitude: 1, birthplace_longitude: 1, place_kind: 'PLACE', place_path: ['Türkiye', `Bölge / Region ${i % 5}`] }));
  return { places, page, next_page: page < 2 ? page + 1 : null, limited: false };
};
export default function MobileSheetFixture() { return <main className="shinka-safe-content bg-shinka-ivory text-shinka-ink"><BirthplaceCombobox language="tr" request={request} onChange={() => {}} /></main>; }
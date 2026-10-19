// Synthetic historical snapshot, never product content or live persistence.
export const dailyRecordFixture = (id = 'daily-fixture', user_id = 'ownerA') => ({
  id, user_id, shinka_date: '2026-10-18', timezone: 'Europe/Istanbul', category_id: 'fixture-category', message_pair_id: 'fixture-pair',
  message_tr_snapshot: 'TR fixture message', suggestion_tr_snapshot: 'TR fixture suggestion',
  message_en_snapshot: 'EN fixture message', suggestion_en_snapshot: 'EN fixture suggestion', generated_at: '2026-10-18T12:00:00Z',
});

import { selectDailyCandidate } from './dailyCandidateSelection.js';
import { InternalError } from './internalAuthorization.js';
import { verifiedDailyRecord } from './dailyRecord.js';
import { DOMAIN_SCHEMAS } from './domainSchemas.js';
import { validateDomainRecord } from './domainValidation.js';

const fail = code => { throw new InternalError(code, 409); };
// generated_at is the persisted backend business instant, not native metadata.
// A late-visible earlier candidate can change the winner; every row is retained.
export function reconcileDailyRows(rows, owner, day) {
  const valid = rows.map(row => verifiedDailyRecord(row, owner, day));
  const first = selectDailyCandidate(valid);
  const content = row => JSON.stringify([row.category_id, row.message_pair_id]);
  const conflict = !!first && valid.some(row => content(row) !== content(first));
  return { record: first || null, notice: conflict ? 'DAILY_DUPLICATE_RECONCILED' : null };
}
export function nativeDailyPersistence(client, owner) {
  const store = client.asServiceRole.entities.UserDailyMessage;
  const read = async query => {
    const rows = [], ids = new Set();
    for (let offset = 0; offset <= 4000; offset += 100) {
      const page = await store.filter({ user_id: owner, ...query }, 'id', 100, offset, ['id', ...Object.keys(DOMAIN_SCHEMAS.user_daily_message.properties)]);
      if (!Array.isArray(page) || page.length > 100) fail('DAILY_READBACK_CONFLICT');
      for (const row of page) {
        if (!row.id || row.user_id !== owner || ids.has(row.id)) fail('DAILY_READBACK_CONFLICT');
        ids.add(row.id); rows.push(row);
      }
      if (rows.length > 4000) fail('DAILY_HISTORY_LIMIT');
      if (page.length < 100) return rows;
    }
    fail('DAILY_HISTORY_LIMIT');
  };
  return {
    async existing(day) { return reconcileDailyRows(await read({ shinka_date: day }), owner, day); },
    // All stored candidates count: a losing candidate may have been shown.
    async history(start, day) {
      return (await read({ shinka_date: { $gte: start, $lte: day } })).map(row => {
        const record = verifiedDailyRecord(row, owner);
        if (record.shinka_date < start || record.shinka_date > day) fail('DAILY_HISTORY_INVALID');
        return record;
      });
    },
    async save(record, guard) {
      validateDomainRecord('user_daily_message', record);
      if (record.user_id !== owner) fail('FORGED_OWNER');
      await guard();
      let selected = await this.existing(record.shinka_date);
      if (selected.record) return { ...selected, created: false };
      await client.shinkaAssertWritable?.();
      await store.create(record); // Never replace an existing daily assignment.
      await guard();
      selected = await this.existing(record.shinka_date);
      if (!selected.record) fail('DAILY_READBACK_CONFLICT');
      return { ...selected, created: true };
    },
  };
}

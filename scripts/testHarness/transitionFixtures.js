// Local performance lab only. Actual native operations over synthetic CRUD;
// serialized responses cross the real SDK HTTP boundary in the production build.
import { nativeFixture } from '../../src/foundation/tests/nativeFixture';
import { dailyRecordFixture } from '../../src/foundation/tests/dailyRecordFixture';
import { patternFixture, patternRow } from '../../src/foundation/tests/patternFixture';
import { handleYouRequest } from '../../base44/shared/youOperation.js';
export async function transitionFixtures() {
  const f = nativeFixture();
  f.tables.UserDailyMessage.push({ ...dailyRecordFixture(), message_pair_id:f.tables.MessagePair[0].id, category_id:f.tables.MessagePair[0].category_id, shinka_date: '2026-10-20' });
  await f.change('add', { date: '2026-10-01' });
  const p = patternFixture();
  p.tables.UserDailyMessage.push(patternRow('2026-10-19'));
  const you = await (await handleYouRequest(new Request('https://fixture.invalid/you', {
    method: 'POST', body: JSON.stringify({ action: 'read' }),
  }), () => f.client(), { now: f.now })).json();
  return {
    applicationSession: { id: 'ownerA', role: 'user', authority: 'BASE44_NATIVE_V1' },
    'onboarding.hydrate': { state: 'ACTIVE_EXISTING_USER', completionReady: true, profile: f.tables.UserProfile[0], preferences: f.tables.UserPreferences[0], today: '2026-10-20' },
    'dailyMessage.today': await f.today(),
    'calendar.read': await f.cal(),
    'pattern.themes': await p.request('themes'),
    'pattern.lunar': await p.request('lunar'),
    'you.read': you,
  };
}

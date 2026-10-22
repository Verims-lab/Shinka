import { nativeFixture } from './nativeFixture';
import { dailyRecordFixture } from './dailyRecordFixture';
import { notificationTick } from '../../../base44/shared/notificationScheduler.js';
import { notificationOwner } from '../../../base44/shared/notificationOwner.js';
import { notificationWindow } from '../../../base44/shared/notificationPolicy.js';
import { deliverDailyNotification } from '../../../base44/shared/notificationDelivery.js';
export function notificationFixture({ current = true, granted = false } = {}) {
  const f = nativeFixture({ granted });
  f.state.time = '2026-10-20T03:00:00.000Z';
  f.tables.UserPreferences[0].notifications_enabled = true;
  const daily = { ...dailyRecordFixture(), shinka_date:current ? '2026-10-20' : '2026-10-19' };
  f.tables.UserDailyMessage.push(daily);
  const sent = [], device = { support:'SUPPORTED',permission:'GRANTED' }, outcomes = [];
  const provider = { eligibility:async()=>device, send:async value=>{ sent.push(value); const outcome=outcomes.shift() || {kind:'accepted'};if(outcome instanceof Error)throw outcome;return outcome; } };
  const options = { provider, library:f.library, now:f.now };
  const tick = () => notificationTick(f.raw(),options);
  const advance = (minutes = 5) => { f.state.time = new Date(+f.now()+minutes*60000).toISOString(); };
  const send = () => {
    const owner = notificationOwner(f.raw(),'ownerA',f.now);
    return deliverDailyNotification({ client:owner.client,owner:'ownerA',daily,window:notificationWindow(f.now(),'Europe/Istanbul'),admit:owner.admit,provider,now:f.now });
  };
  return { ...f, daily, provider, device, outcomes, sent, tick, advance, send, options };
}

import { NOTIFICATION_COPY, notificationFail as fail } from './notificationPolicy.js';

// 042 user-relayed Fode/Base44 Support supplies required fields/native User.id
// and acceptance/error semantics. This is written support evidence, not hosted
// verification. Existing documented limits and Home-only app policy remain.
/** @param {unknown} input @returns {import('./notificationProviderTypes.js').ReportedPushInput} */
export function validateReportedPushInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('PUSH_INPUT_INVALID',400);
  const value = /** @type {Record<string, unknown>} */ (input);
  if (Object.keys(value).some(key => !['user_id','title','content','action_label','action_url'].includes(key))) fail('PUSH_INPUT_INVALID',400);
  const text = (field, limit) => {
    const item = value[field];
    if (typeof item !== 'string' || !item.trim() || [...item].length > limit) fail('PUSH_INPUT_INVALID',400);
    return /** @type {string} */ (item);
  };
  /** @type {import('./notificationProviderTypes.js').ReportedPushInput} */
  const result = { user_id:text('user_id',Infinity),title:text('title',100),content:text('content',500) };
  if (value.action_label !== undefined) {
    if (value.action_label !== null && (typeof value.action_label !== 'string' || [...value.action_label].length > 50)) fail('PUSH_INPUT_INVALID',400);
    result.action_label = /** @type {string | null} */ (value.action_label);
  }
  // Home-only is app policy. Docs confirm the link is optional, not its null schema.
  // Omit the URL in the daily adapter; only the existing Home path is allowable.
  if (value.action_url !== undefined) {
    if (value.action_url !== null && value.action_url !== '/') fail('PUSH_DESTINATION_INVALID',400);
    result.action_url = /** @type {string | null} */ (value.action_url);
  }
  return result;
}

/** @param {import('./notificationProviderTypes.js').PushClient} client
 * @param {{timeoutMs?:number,timers?:{set:(fn:()=>void,ms:number)=>any,clear:(id:any)=>void}}} [options] */
export function base44PushProvider(client, { timeoutMs=8000, timers={set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)} } = {}) {
  return {
    async eligibility(_owner) {
      // No platform eligibility API exists. Unknown is not granted permission.
      return { support:'UNKNOWN',permission:'UNKNOWN',observation:'NOT_EXPOSED' };
    },
    async send({ owner, language }) {
      const copy = NOTIFICATION_COPY[language === 'tr' ? 'tr' : 'en'];
      // Docs specify Home when the optional link is omitted; device proof is open.
      // No daily date or personal snapshot enters this minimal notification.
      const params = validateReportedPushInput({ user_id:owner,title:copy.title,content:copy.message });
      let timer;
      try {
        // Installed SDK integrations unwrap response.data (unlike functions).
        const output = await Promise.race([
          client.asServiceRole.integrations.Core.SendPushNotification(params),
          new Promise(resolve=>{timer=timers.set(()=>resolve(null),timeoutMs);}),
        ]);
        // Channel values are opaque: support gives no inner type contract.
        // Require both fields to be present and non-null; never log their data.
        const result = output && typeof output === 'object' && !Array.isArray(output) ? /** @type {Record<string,unknown>} */ (output) : null;
        if (result &&
            result.status === 'sent' && Object.hasOwn(result,'successful_channels') &&
            Object.hasOwn(result,'failed_channels') && result.successful_channels != null && result.failed_channels != null)
          return { kind:'accepted' }; // provider acceptance, not device delivery
      } catch (error) {
        // 404: invalid/removed/outside-app native recipient; 403: not service role.
        // 502, timeout and unknown transport outcomes never authorize a retry.
        if (error?.status === 404 || error?.status === 403) return { kind:'permanent' };
      } finally { timers.clear(timer); }
      // Deadline does not cancel the SDK request. A late result cannot change
      // this outcome or authorize a resend; persisted IN_FLIGHT/UNKNOWN wins.
      return { kind:'unknown' };
    },
  };
}

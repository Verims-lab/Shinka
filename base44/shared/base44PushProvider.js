import { NOTIFICATION_COPY, notificationFail as fail } from './notificationPolicy.js';

// 030 input schema was relayed by the owner from Base44 AI, not live verified.
// This narrow type does not augment the SDK or invent a response contract.
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
  // App policy is narrower than the reported optional-string platform schema.
  // Omit the URL in the daily adapter; only the existing Home path is allowable.
  if (value.action_url !== undefined) {
    if (value.action_url !== null && value.action_url !== '/') fail('PUSH_DESTINATION_INVALID',400);
    result.action_url = /** @type {string | null} */ (value.action_url);
  }
  return result;
}

/** @param {import('./notificationProviderTypes.js').PushClient} client */
export function base44PushProvider(client) {
  return {
    async eligibility(_owner) {
      return { support:'UNKNOWN',permission:'UNKNOWN' };
    },
    async send({ owner, language }) {
      const copy = NOTIFICATION_COPY[language === 'tr' ? 'tr' : 'en'];
      // Home is the documented default when the optional link is omitted.
      // No daily date or personal snapshot enters this minimal notification.
      const params = validateReportedPushInput({ user_id:owner,title:copy.title,content:copy.message });
      try {
        // Promise<unknown>: even a resolved 2xx object has no established meaning.
        await client.asServiceRole.integrations.Core.SendPushNotification(params);
      } catch { /* 403/502/timeout are not a complete no-send/error contract. */ }
      // Never forward raw output, infer SENT, or automatically retry this call.
      return { kind:'unknown' };
    },
  };
}

import { NOTIFICATION_COPY, notificationFail as fail } from './notificationPolicy.js';

// SDK 0.8.57 implements Core methods with a dynamic proxy. Official documentation
// names SendPushNotification, but does not publish its named parameters, result
// schema or a device-eligibility read. Missing bindings must never imply success.
// A binding is backend code, never JSON/config supplied by an HTTP caller.
export function base44PushProvider(client, binding = null) {
  return {
    async eligibility(owner) {
      return binding ? binding.eligibility(client, owner) : { support:'UNKNOWN',permission:'UNKNOWN' };
    },
    async send({ owner, language }) {
      if (!binding) fail('PUSH_CONTRACT_UNVERIFIED',503);
      const copy = NOTIFICATION_COPY[language === 'tr' ? 'tr' : 'en'];
      // Home is the documented default when the optional link is omitted.
      // No daily date or personal snapshot enters this minimal notification.
      const params = binding.encode({ owner, ...copy });
      try {
        const result = await client.asServiceRole.integrations.Core.SendPushNotification(params);
        return binding.decode(result);
      } catch (error) { return binding.failure(error); }
    },
  };
}

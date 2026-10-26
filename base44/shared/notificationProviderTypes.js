// Local narrow input based on user-relayed Base44 AI (030). User-relayed Dmytro /
// Base44 Support confirms these field names (034). Official integration docs
// confirm 100/500/50 limits and optional action/link with Home default. Full wire
// types/requiredness/nullability/Unicode counting, User.id and response JSON are open;
// this is not a hosted-verified SDK contract. Provider output stays unknown.
/**
 * @typedef {object} ReportedPushInput
 * @property {string} user_id
 * @property {string} title
 * @property {string} content
 * @property {string | null} [action_label]
 * @property {string | null} [action_url]
 */
/**
 * @typedef {object} PushClient
 * @property {{integrations: {Core: {SendPushNotification: (input: ReportedPushInput) => Promise<unknown>}}}} asServiceRole
 */
export {};

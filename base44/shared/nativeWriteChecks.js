import { InternalError } from './internalAuthorization.js';
import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';

const mutations = new Set(['create', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany', 'bulkCreate', 'bulkUpdate', 'importEntities']);
const productNames = new Set(Object.keys(DOMAIN_SCHEMAS).map(physicalName));
// Checks immediately before/after each SDK write reduce the in-flight window.
// They are NOT a distributed fence. Delete additionally requires operator drain.
/** @param {any} client @param {{paused?: () => boolean}} options */
export function withNativeWriteChecks(client, { paused = () => false } = {}) {
  const check = async () => {
    if (paused()) throw new InternalError('MAINTENANCE_WRITE_PAUSED', 503);
    await client.auth.me(); // Fresh User + persistent lifecycle/tombstone.
  };
  const entities = new Proxy(client.asServiceRole.entities, {
    get(target, name) {
      const entity = target[name];
      if (!productNames.has(name)) return entity;
      return new Proxy(entity, {
        get(handler, method) {
          if (!mutations.has(String(method))) return handler[method];
          return async (...args) => {
            await check();
            const result = await handler[method](...args);
            await check();
            return result;
          };
        },
      });
    },
  });
  return { ...client, shinkaNative: true, auth: client.auth, asServiceRole: { ...client.asServiceRole, entities }, shinkaAssertWritable: check };
}

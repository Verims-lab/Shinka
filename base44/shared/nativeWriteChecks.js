import { InternalError } from './internalAuthorization.js';
import { DOMAIN_SCHEMAS, physicalName } from './domainSchemas.js';
import { createTestRepository } from './adminTestRepository.js';
import { assertPrivacyAccess, HEALTH_CLEANUP } from './privacyPolicy.js';

const mutations = new Set(['create', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany', 'bulkCreate', 'bulkUpdate', 'importEntities']);
const productNames = new Set([...Object.keys(DOMAIN_SCHEMAS).map(physicalName), 'UserCalendarAction']);
const ownedNames = new Set([...Object.entries(DOMAIN_SCHEMAS).filter(([,s]) => s.properties.user_id).map(([name]) => physicalName(name)), 'UserCalendarAction']);
const fail = code => { throw new InternalError(code, 409); };

// Request-scoped admission around every SDK mutation, not a distributed lock.
// Destructive admin cleanup has its own target-bound authorization/journal path.
// No global write-pause flag (017): per-owner lifecycle/consent/privacy checks only.
/** @param {any} client */
export function withNativeWriteChecks(client) {
  const repository = createTestRepository(client);
  const check = async (owner = null) => {
    const actor = await client.auth.me();
    if (!owner) return actor;
    if (owner !== actor.id && actor.role !== 'admin') throw new InternalError('OWNER_REQUIRED', 403);
    if ((await repository.lifecycle(owner))?.operation === 'DELETE_USER') throw new InternalError('ACCOUNT_DELETION_IN_PROGRESS', 403);
    await assertPrivacyAccess(client, owner);
    if (owner !== actor.id && !await repository.user(owner)) throw new InternalError('AUTH_REQUIRED', 401);
    return actor;
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
            let owners = [];
            if (ownedNames.has(name)) {
              if (['create', 'bulkCreate', 'upsert'].includes(String(method))) {
                const rows = Array.isArray(args[0]) ? args[0] : [args[0]];
                owners = rows.map(row => row?.user_id);
                if(method==='upsert' && (!(Array.isArray(args[1]?.key)?args[1].key:[args[1]?.key]).includes('user_id') || rows.some(row=>row?.id)))fail('WRITE_TARGET_REQUIRED');
                if (!owners.length || owners.some(id => typeof id !== 'string' || !id)) fail('WRITE_TARGET_REQUIRED');
              } else if (['update', 'delete'].includes(String(method))) {
                const rows = await handler.filter({ id: args[0] }, 'id', 2, 0, ['id','user_id']);
                if (!Array.isArray(rows) || rows.length !== 1 || rows[0].id !== args[0]) fail('WRITE_TARGET_UNCONFIRMED');
                owners = [rows[0].user_id];
              } else if (['updateMany', 'deleteMany'].includes(String(method))) {
                if (typeof args[0]?.user_id !== 'string') fail('WRITE_TARGET_REQUIRED');
                owners = [args[0].user_id];
              } else fail('WRITE_TARGET_REQUIRED'); // No unscoped import/bulk-update escape.
              if(owners.some(owner=>typeof owner!=='string'||!owner))fail('WRITE_TARGET_REQUIRED');
              const patch = args[1]?.$set || args[1];
              if (patch?.user_id && owners.some(owner => patch.user_id !== owner)) fail('WRITE_TARGET_CONFLICT');
              for (const owner of new Set(owners)) {
                await check(owner);
                if (HEALTH_CLEANUP.includes(String(name)) || name === 'UserHealthConsent') await assertPrivacyAccess(client, owner, { health: true });
              }
            }
            const result = await handler[method](...args);
            for (const owner of new Set(owners)) {
              await check(owner);
              if (HEALTH_CLEANUP.includes(String(name)) || name === 'UserHealthConsent') await assertPrivacyAccess(client, owner, { health: true });
            }
            await check();
            return result;
          };
        },
      });
    },
  });
  return { ...client, shinkaNative: true, auth: client.auth, asServiceRole: { ...client.asServiceRole, entities }, shinkaAssertWritable: check };
}
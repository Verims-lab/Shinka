import { InternalError } from './internalAuthorization.js';

// Shared ordinary-SDK deletion primitive. A missing-row response is not evidence
// of absence until a scoped read succeeds. No catch-all success or bulk delete.
export async function deleteAndVerifyAbsent(entities, name, id, query, code = 'PRIVACY_DELETE_UNCONFIRMED') {
  try { await entities[name].delete(id); }
  catch (error) {
    if (error.code !== 'TEST_STORAGE_NOT_FOUND' && (error?.response?.status || error?.status) !== 404) throw error;
  }
  const rows = await entities[name].filter({ ...query, id }, 'id', 2, 0, ['id']);
  if (!Array.isArray(rows) || rows.length) throw new InternalError(code, 503);
}

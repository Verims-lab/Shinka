import { base44 } from '@/api/base44Client';
import { TEST_TOOLS_COPY } from '@/foundation/i18n/testToolsCopy';
const safe = new Set([...Object.keys(TEST_TOOLS_COPY.en), 'TEST_USER_NOT_FOUND', 'TEST_OPERATION_NOT_FOUND', 'TEST_OPERATION_CONFLICT', 'TEST_REFERENCE_CONFLICT', 'TEST_SCOPE_TOO_LARGE', 'TEST_OWNER_CONFLICT', 'CONFIRMATION_INVALID']);
export async function adminTestRequest(action, payload, client = base44) {
  let timer;
  try {
    const response = await Promise.race([
      client.functions.invoke('adminTestTools', { action, ...payload }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('TEST_TOOLS_TIMEOUT')), 30000); }),
    ]);
    if (response.data?.error_code) throw { response: { data: response.data } };
    return response.data;
  } catch (error) {
    const code = error?.response?.data?.error_code;
    throw Object.assign(new Error('TEST_TOOLS_FAILED'), { code: safe.has(code) ? code : 'TEST_TOOLS_FAILED' });
  } finally { clearTimeout(timer); }
}

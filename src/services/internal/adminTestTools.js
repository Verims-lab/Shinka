import { base44 } from '@/api/base44Client';
const safeCode = value => typeof value === 'string' && /^[A-Z][A-Z0-9_]{1,79}$/.test(value) ? value : null;
const safeRequest = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : null;
export function testToolsError(error) {
  const data = error?.response?.data;
  const code = safeCode(data?.error_code) || (error?.code === 'TEST_TOOLS_TIMEOUT' ? error.code : 'TEST_TOOLS_FAILED');
  return Object.assign(new Error(code), { code, stage:safeCode(data?.stage), requestId:safeRequest(data?.request_id) });
}
/** @param {string} action @param {object} payload @param {{functions:{invoke:(name:string,body:object)=>Promise<any>}}} [client] @param {number} [timeoutMs] */
export async function adminTestRequest(action, payload, client = base44, timeoutMs = 30000) {
  let timer;
  try {
    const response = await Promise.race([
      client.functions.invoke('adminTestTools', {action, ...payload}),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('TEST_TOOLS_TIMEOUT'), {code:'TEST_TOOLS_TIMEOUT'})), timeoutMs); }),
    ]);
    if (response.data?.error_code) throw {response:{data:response.data}};
    return response.data;
  } catch (error) { throw testToolsError(error); }
  finally { clearTimeout(timer); }
}

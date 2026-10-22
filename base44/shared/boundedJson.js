// Shared bounded JSON body reader. Enforces a real byte limit while streaming,
// independent of a missing or wrong Content-Length, and cancels at the limit.
// `fail(code, status)` must throw the caller's own safe error type.
export async function readBoundedJson(req, maxBytes, fail, { allowEmpty = false } = {}) {
  const declared = req.headers?.get?.('content-length');
  if (declared != null && declared !== '') {
    if (!/^\d{1,12}$/.test(declared)) fail('INVALID_REQUEST', 400);
    if (Number(declared) > maxBytes) fail('REQUEST_TOO_LARGE', 413);
  }
  const chunks = []; let size = 0;
  if (req.body) {
    const reader = req.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          try { await reader.cancel(); } catch { /* keep the size error */ }
          fail('REQUEST_TOO_LARGE', 413);
        }
        chunks.push(value);
      }
    } finally {
      try { reader.releaseLock(); } catch { /* already released/cancelled */ }
    }
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let text; try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { fail('INVALID_REQUEST', 400); }
  if (!text && allowEmpty) return {};
  let body; try { body = JSON.parse(text); } catch { fail('INVALID_REQUEST', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('INVALID_REQUEST', 400);
  return body;
}
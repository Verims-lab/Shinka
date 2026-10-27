import { InternalError, requireAuthenticatedUser } from './internalAuthorization.js';
import { readBoundedJson } from './boundedJson.js';
import { resolveAuthenticatedOwner } from './domainSecurity.js';
import { guardDomainOwner } from './nativeDomainGuard.js';
import { resolveTimezone, serverLocalDate } from './onboardingValidation.js';
import { patternReader } from './patternReader.js';
import { patternWindowStart, calculatePatternSummary, calculateLunarSummary } from './patternCalculation.js';

export async function patternOperation(client, body, { now = () => new Date() } = {}) {
  const principal = await requireAuthenticatedUser(client), owner = resolveAuthenticatedOwner(principal, body);
  if (!['themes', 'lunar'].includes(body.action) || Object.keys(body).some(k => !['action', 'timezone'].includes(k))) throw new InternalError('INVALID_REQUEST', 400);
  await guardDomainOwner(client, owner, 'user_pattern_summary');
  const reader = patternReader(client, owner), preferences = await reader.preferences();
  const timezone = resolveTimezone(body.timezone, preferences?.timezone), instant = now();
  let result;
  if (body.action === 'themes') {
    const day = serverLocalDate(instant, timezone);
    const [rows, firstDay] = await Promise.all([reader.history(patternWindowStart(day), day), reader.firstDay(day)]);
    if ((!firstDay && rows.length) || (firstDay >= patternWindowStart(day) && firstDay <= day && !rows.some(row => row.shinka_date === firstDay))) throw new InternalError('PATTERN_DATA_CHANGED', 409);
    const summary = calculatePatternSummary({ rows, owner, timezone, instant, firstDay });
    const categories = rows.length ? await reader.categories() : [];
    if (rows.some(row => !categories.some(category => category.id === row.category_id))) throw new InternalError('PATTERN_CATEGORY_CONFLICT', 409);
    const themes = ['primary', 'secondary'].flatMap(prefix => {
      const id = summary[`${prefix}_category_id`];
      return id ? [{ ...categories.find(c => c.id === id), count: summary[`${prefix}_count`] }] : [];
    });
    result = { section: 'themes', state: themes.length ? 'READY' : 'EMPTY', summary, themes };
  } else {
    const lunar = calculateLunarSummary(await reader.moon(instant), instant, timezone);
    result = { section: 'lunar', state: lunar.current && lunar.next_full ? 'READY' : 'PARTIAL', lunar };
  }
  // Fresh admission before returning personal data; not snapshot isolation.
  const latest = await requireAuthenticatedUser(client);
  if (latest.id !== owner) throw new InternalError('AUTH_REQUIRED', 401);
  await guardDomainOwner(client, owner, 'user_pattern_summary');
  return result;
}
export async function handlePatternRequest(req, createClient, dependencies = {}) {
  try {
    if (req.method !== 'POST') throw new InternalError('METHOD_NOT_ALLOWED', 405);
    const body = await readBoundedJson(req, 1000, (code, status) => { throw new InternalError(code, status); });
    return Response.json(await patternOperation(createClient(req), body, dependencies));
  } catch (error) {
    return Response.json({ error_code: error instanceof InternalError ? error.code : 'PATTERN_READ_FAILED' }, { status: error instanceof InternalError ? error.status : 503 });
  }
}
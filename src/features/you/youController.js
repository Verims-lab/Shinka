import { optionalName, optionalBirthTime, validateBirthDate, OnboardingError } from '../../../base44/shared/onboardingValidation.js';
import { isYouPrivacyError, deviceTimezone } from '@/services/youService';
const profileDraft = p => ({ display_name: p.display_name ?? '', birth_date: p.birth_date, birth_time: p.birth_time ?? '', birthplace: { selection: p.birthplace_geonames_id == null ? null : p, incomplete: false }, revision: p.revision });
export function createYouController(request, onSaved = (_value) => {}, onLoaded = (_value) => {}) {
  let state = { value: null, loading: false, busy: false, error: null, editing: false, draft: null, preferences: null, intent: null, result: null };
  let generation = 0, disposed = false;
  const listeners = new Set();
  const emit = patch => { if (!disposed) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const fail = error => {
    if (isYouPrivacyError(error?.code)) emit({ value: null, draft: null, preferences: null, intent: null, editing: false, error, result: null });
    else emit({ error, result: null });
  };
  const accept = (section, result) => {
    const value = { ...state.value, [section]: result[section] };
    emit({ value, intent: null, error: null, result: section, ...(section === 'profile' ? { editing: false, draft: null } : { preferences: { ...result.preferences } }) });
    onSaved(value);
  };
  const load = async () => {
    if (disposed || state.busy || state.loading) return;
    const ticket = ++generation; emit({ loading: true, error: null, result: null, value: null, draft: null, preferences: null, intent: null, editing: false });
    try { const value = await request('read'); if (ticket === generation) { emit({ value, preferences: { ...value.preferences } }); onLoaded(value); } }
    catch (error) { if (ticket === generation) fail(error); }
    finally { if (ticket === generation) emit({ loading: false }); }
  };
  const send = async (intent, verify = false) => {
    if (disposed || state.busy || !state.value) return;
    const ticket = ++generation; emit({ busy: true, error: null, result: null, intent });
    try {
      const result = await request(`${verify ? 'verify' : 'save'}${intent.section === 'profile' ? 'Profile' : 'Preferences'}`, intent.payload);
      if (ticket !== generation) return;
      if (result.state === 'VERIFIED') accept(intent.section, result);
      else emit({ error: { code: 'YOU_WRITE_UNCONFIRMED', unknown: true } });
    } catch (error) { if (ticket === generation) fail(error); }
    finally { if (ticket === generation) emit({ busy: false }); }
  };
  const saveProfile = async () => {
    if (state.busy || !state.draft) return;
    try {
      const d = state.draft;
      validateBirthDate(d.birth_date, state.value.today); optionalBirthTime(d.birth_time); optionalName(d.display_name);
      if (d.birthplace.incomplete) throw new OnboardingError('PLACE_SELECTION_INCOMPLETE', 'birthplace');
      await send({ section: 'profile', payload: { display_name: optionalName(d.display_name), birth_date: d.birth_date, birth_time: optionalBirthTime(d.birth_time), birthplace_geonames_id: d.birthplace.selection?.birthplace_geonames_id ?? null, revision: d.revision } });
    } catch (error) { fail(error); }
  };
  return {
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); }, getSnapshot: () => state, load,
    edit: () => { if (!state.busy && state.value) emit({ editing: true, draft: profileDraft(state.value.profile), error: null, result: null, intent: null }); },
    change: (key, value) => { if (!state.busy && state.draft && !state.error?.unknown) emit({ draft: { ...state.draft, [key]: value }, error: null, result: null, intent: null }); },
    preference: (key, value) => { if (!state.busy && state.preferences && !state.error?.unknown) emit({ preferences: { ...state.preferences, [key]: value }, error: null, result: null, intent: null }); },
    cancel: () => { if (!state.busy && !state.error?.unknown) emit({ editing: false, draft: null, error: null, result: null, intent: null }); },
    saveProfile,
    savePreferences: () => send({ section: 'preferences', payload: { language_code: state.preferences.language_code, notifications_enabled: state.preferences.notifications_enabled, timezone: deviceTimezone(), revision: state.preferences.revision } }),
    retry: () => state.intent && send(state.intent), check: () => state.intent && send(state.intent, true),
    invalidate: () => { generation++; emit({ value: null, draft: null, preferences: null, intent: null, busy: false, loading: false, editing: false, error: { code: 'AUTH_REQUIRED' }, result: null }); },
    dispose: () => { generation++; state = { ...state, value: null, draft: null, preferences: null, intent: null }; disposed = true; listeners.clear(); },
  };
}

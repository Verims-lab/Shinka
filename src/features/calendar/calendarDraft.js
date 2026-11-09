// Presentation-only intent over the admitted start-date snapshot. The backend
// remains the date, consent, revision and calculation authority.
export function calendarDraft(state) {
  if (!state.editMode || !state.selected) return { action: null, error: null };
  const action = state.editing ? state.editing.date === state.selected ? 'delete' : 'edit' : 'add';
  if (action === 'delete') return { action, error: null };
  if (state.selected > state.value.today) return { action, error: 'PERIOD_START_FUTURE' };
  const date = Date.parse(`${state.selected}T12:00:00Z`);
  const conflict = state.value.starts.some(row => row.id !== state.editing?.id && Math.abs(Date.parse(`${row.date}T12:00:00Z`) - date) < 15 * 86400000);
  return { action, error: conflict ? 'PERIOD_CONFLICT' : null };
}

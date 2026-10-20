// Shared Home/Pattern ordering of already validated immutable candidates.
// Same observed rows => same winner; this is not physical uniqueness.
export function selectDailyCandidate(rows) {
  return [...rows].sort((a, b) => Date.parse(a.generated_at) - Date.parse(b.generated_at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0] || null;
}

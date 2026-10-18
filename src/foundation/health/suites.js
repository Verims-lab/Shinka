// Canonical suite families. Stable IDs — never renumber casually.
export const SUITES = Object.freeze([
  { id: "H01", name: "Environment & Build", active: true },
  { id: "H02", name: "Source & Documentation Integrity", active: true },
  { id: "H03", name: "Architecture & Code Quality", active: true },
  { id: "H04", name: "Data Model Contract", active: true },
  { id: "H05", name: "Content Artifact Integrity", active: true },
  { id: "H06", name: "Auth & Identity", active: false },
  { id: "H07", name: "Onboarding", active: false },
  { id: "H08", name: "Cycle & Calendar", active: false },
  { id: "H09", name: "Daily Content Engine", active: false },
  { id: "H10", name: "Pattern / Astronomy / GeoNames", active: false },
  { id: "H11", name: "Consent / Account / Data Protection", active: false },
  { id: "H12", name: "Security & Ownership", active: true },
  { id: "H13", name: "UI / UX / Accessibility", active: true },
  { id: "H14", name: "Notifications & Scheduler", active: false },
  { id: "H15", name: "Resilience & Performance", active: false },
  { id: "H16", name: "Release Gate", active: true },
]);
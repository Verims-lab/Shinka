// UI/UX v1.1 (SRC-03) structural contract — navigation, icons, screens, flows. Documented contract;
// onboarding screens are implemented with explicit source/adapter gaps; other product screens remain FUTURE_PACKAGE. Lucide names are kebab-case; `component` is the lucide-react export.
export const BOTTOM_NAV = Object.freeze([
  { key: "home", labelKey: "nav.home", lucide: "house", component: "House" },
  { key: "calendar", labelKey: "nav.calendar", lucide: "calendar-days", component: "CalendarDays" },
  { key: "pattern", labelKey: "nav.pattern", lucide: "moon", component: "Moon" },
]);
// You opens ONLY from the top-right profile icon (44×44); never a bottom-nav destination.
export const PROFILE_ENTRY = Object.freeze({ key: "you", labelKey: "nav.you", lucide: "user-round", component: "UserRound", placement: "top-right", touchTarget: 44 });

export const ONBOARDING_SEQUENCE = Object.freeze([
  { id: "ON-01", name: "Introduction" },
  { id: "ON-02", name: "Welcome / Sign In" },
  { id: "ON-03", name: "Optional name" },
  { id: "ON-04", name: "Personal Details" },
  { id: "ON-05", name: "Your cycle, your choice" },
  { id: "ON-06", name: "First Shinka preparation", interstitial: true },
  { id: "HOME", name: "Home" },
]);

export const SCREEN_INVENTORY = Object.freeze(["ON-01", "ON-02", "ON-03", "ON-04", "ON-05", "ON-06", "HOME", "CALENDAR", "PATTERN", "YOU", "WITHDRAW_CONSENT_SHEET"]);
export const HOME_CARDS = Object.freeze(["Your Shinka", "Today’s Suggestion"]);
export const CALENDAR_LEGEND = Object.freeze(["Period", "Predicted", "Selected"]);
export const PATTERN_SECTIONS = Object.freeze(["Your Recurring Themes", "Lunar Timeline"]);
export const YOU_BLOCKS = Object.freeze({
  "My Profile": ["Name (optional)", "Date of birth (required)", "Birth time (optional, HH:mm)", "Birthplace (optional, GeoNames)", "Sun sign (read-only)"],
  "App Preferences": ["Language (TR/EN)", "Daily Notifications (06:00 fixed)"],
  "Account & Privacy": ["Privacy Policy", "Terms of Service", "Health Data Consent", "Sign Out", "Delete Account"],
});
export const WITHDRAW_SHEET = Object.freeze({
  title: "Withdraw health data consent?",
  body: "Your cycle records, predictions, and calculated phases will be deleted. Your account will remain active.",
  distinctFrom: "Delete Account",
});

// Centralized UI state patterns — never collapsed into one machine state.
export const UI_STATES = Object.freeze(["LOADING", "OFFLINE", "LOAD_FAILURE", "NOT_READY", "VALIDATION_ERROR", "ACTION_ERROR", "SUCCESS", "RETRY", "DISABLED", "EMPTY"]);
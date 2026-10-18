// SRC-03 machine-readable tables — mirrored VERBATIM from the UI/UX v1.1 companion (supporting artifact, NOT a logical source).
// Approved EN strings are source copy: never paraphrase.
export const UIUX_COMPANION = Object.freeze({
  file: "Shinka_UI_UX_v1.1_Machine_Readable_Tables_Companion.docx",
  role: "MACHINE_READABLE_TABLE_COMPANION", mirrors: "SRC-03", version: "1.1", date: "2026-10-18", status: "READ",
  url: "https://media.base44.com/files/public/6ad5190f4845d4e3af03b420/66a0c4502_Shinka_UI_UX_v11_Machine_Readable_Tables_Companion.docx",
  visualReferenceRules: ["Written specification controls over illustrative mockups", "Mockup dates, names and incidental icon differences are examples only", "No business rule is inferred from images"],
  visualReferenceNotes: 11,
});

export const DESIGN_TABLE = Object.freeze({
  colors: { primaryPlum: "#6F415A", deepPlumText: "#4C263F", mutedMauve: "#93637B", dustyRose: "#D8A5AA", blushPink: "#F2D7D4", softLavender: "#E7DCE8", warmIvory: "#FFF8F3", softCream: "#F9EEE8", mutedTaupe: "#87757D", divider: "#EDE3E3", white: "#FFFFFF" },
  headingSizes: [[34, 40], [28, 34], [24, 30], [20, 26]], bodySizes: [[17, 25], [15, 22], [13, 18]],
  pagePadding: 20, spacing: [4, 8, 12, 16, 20, 24, 32, 40], radii: [12, 16, 20, 999],
  primaryCta: { minHeight: 52, radius: 16, disabledOpacity: 0.45 }, input: { minHeight: 52, radius: 16, paddingX: 16 },
  touchTarget: 44, transitionMs: 200,
});

export const ICON_TABLE = Object.freeze([
  { item: "Home", icon: "house", placement: "BOTTOM_NAV" }, { item: "Calendar", icon: "calendar-days", placement: "BOTTOM_NAV" },
  { item: "Pattern", icon: "moon", placement: "BOTTOM_NAV" }, { item: "You", icon: "user-round", placement: "TOP_RIGHT_PROFILE" },
]);

export const APPROVED_COPY = Object.freeze({
  onboarding: ["Please enter a shorter name", "Please confirm that you are 18 or older", "We couldn’t sign you in. Please try again", "Please enter your date of birth", "Please enter a valid date", "Date of birth cannot be in the future", "Shinka is available for users aged 18 and over", "Please enter a valid time", "Please select a place from the list", "No places found", "We couldn’t load places. Please try again", "Please enter your last period start date", "Period start date cannot be in the future", "Please enter a whole number of days", "Please enter a valid period duration", "Please enter a duration within the supported range", "Please enter a valid cycle length", "Please enter a cycle length within the supported range(15-60)", "Please consent to the use of your cycle data to continue"],
  home: ["Your Shinka is on its way", "You’re offline. Please check your connection", "We couldn’t load your Shinka. Please try again", "Your Shinka isn’t ready yet. Please try again shortly"],
  calendar: ["Please select a date", "Period start date cannot be in the future", "Please select a valid date", "This date is already marked as a period start", "This date conflicts with an existing period record", "We couldn’t save your period start. Please try again", "You’re offline. Please check your connection", "Please consent to the use of your cycle data to continue", "Delete this period start?", "This period start will be deleted. Your cycle predictions will be updated.", "Delete period start", "Cancel", "We couldn’t delete this period start. Please try again", "Period start deleted", "No period predictions yet. Mark a period start to see predictions"],
  pattern: ["Your themes will appear after your first Shinka", "We couldn’t load your themes. Please try again", "We couldn’t load the lunar timeline. Please try again", "Moon phase information is temporarily unavailable"],
  you: ["We couldn’t save your changes. Please try again", "Your profile has been updated", "We couldn’t update your language. Please try again", "Please enable notifications in your device settings", "We couldn’t update your notification settings", "Your health data has been deleted", "We couldn’t complete your request. Please try again", "Cycle tracking requires your consent", "We couldn’t sign you out. Please try again", "Deactivate your account?", "Your account will become inactive. You won’t be able to use Shinka or receive daily notifications. Your data will not be automatically deleted.", "Delete Account", "Cancel", "We couldn’t deactivate your account. Please try again", "Deactivate account", "Your account is now inactive", "Your previous health data deletion must finish before you can consent again"],
});

export const QA_CHECKLIST = Object.freeze(["INVALID_INPUT_NOT_SAVED_INLINE_ERROR", "LOADING_AND_DOUBLE_SUBMIT_DISABLED", "SUCCESS_ONLY_AFTER_COMPLETION", "NETWORK_ERROR_RETRY_KEEPS_RECORD", "DESTRUCTIVE_EXPLAIN_AND_CONFIRM", "A11Y_44PX_SR_LABEL_CONTRAST_READABLE", "LUCIDE_FUNCTIONAL_ICONS", "LOCAL_TIME_DDMM_HHMM_NOTIFY_0600", "LUNAR_TIMELINE_NO_HSCROLL", "SAME_DAY_RETRY_SAME_PAIR", "CALENDAR_DELETE_SEMANTICS", "INACTIVE_ACCOUNT_SEMANTICS", "DEFAULTS_NOT_SHOWN_AS_ENTERED", "IANA_TIMEZONE_AUTO_LAST_KNOWN", "PATTERN_ACTUAL_ASSIGNED_CATEGORY", "PROTECTED_RECORDS_IMMUTABLE"]);

// 11 source tables with row counts as read from the companion (header row excluded).
export const UIUX_TABLES = Object.freeze([
  { n: 1, title: "Navigation & screen inventory", rows: 10 }, { n: 2, title: "Design system and geometry", rows: 17 },
  { n: 3, title: "Functional Lucide icon mapping", rows: ICON_TABLE.length }, { n: 4, title: "Pattern category display names", rows: 6 },
  { n: 5, title: "Withdraw health consent bottom-sheet outcomes", rows: 3 }, { n: 6, title: "Onboarding / You validation and approved EN copy", rows: 21 },
  { n: 7, title: "Home states and approved EN behavior", rows: 5 }, { n: 8, title: "Calendar states and approved EN copy", rows: 16 },
  { n: 9, title: "Pattern states and approved EN behavior", rows: 6 }, { n: 10, title: "You / account states and approved EN behavior", rows: 17 },
  { n: 11, title: "Shared interaction / accessibility / QA checklist", rows: QA_CHECKLIST.length },
]);
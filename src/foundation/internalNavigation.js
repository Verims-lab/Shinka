import { resolveLanguage, SUPPORTED_LANGUAGES } from "./i18n/strings";

// Fixed destinations only. Route state carries display language, never authority.
export const ADMIN_PANEL_PATH = "/internal";
export const INTERNAL_TOOLS = Object.freeze([
  { path: "/internal/health", titleKey: "admin.health", descriptionKey: "admin.healthDescription" },
  { path: "/internal/build", titleKey: "admin.build", descriptionKey: "admin.buildDescription" },
]);
export const INTERNAL_ROUTES = Object.freeze([ADMIN_PANEL_PATH, ...INTERNAL_TOOLS.map(tool => tool.path)]);
export const internalLanguage = (state) => SUPPORTED_LANGUAGES.includes(state?.language) ? state.language : resolveLanguage();
export const internalLinkClass = "min-h-11 px-4 inline-flex items-center rounded-xl text-sm border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shinka-plum";

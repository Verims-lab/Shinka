// Shinka design token authority. CSS variables in src/index.css mirror these values.
// STATUS: PROVISIONAL — exact approved values pending receipt of UI/UX Tasarım v1.1 (OD-001).
export const DESIGN_TOKENS = Object.freeze({
  status: "PROVISIONAL_PENDING_UIUX_V1_1",
  theme: "light-only",
  color: {
    ivory: "#FAF6EF", surface: "#FFFDF9", plum: "#5C2A50", plumDeep: "#3F1D38", plumSoft: "#F2E8EF",
    ink: "#2B2128", muted: "#7A6A74", line: "#EAE1D7",
  },
  typography: {
    heading: '"Cormorant Garamond", Georgia, serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
    scale: { caption: 12, body: 14, lead: 16, h3: 24, h2: 32, h1: 44 },
    weights: { regular: 400, medium: 500, semibold: 600 },
  },
  spacing: [4, 8, 12, 16, 24, 32, 48, 64],
  radii: { sm: 8, md: 12, lg: 20, pill: 999 },
  control: { buttonHeight: 48, inputHeight: 48 },
  touchTargetMin: 44,
  iconFamily: "lucide-react",
  motion: { fastMs: 150, baseMs: 220 },
  card: { radius: 20, border: "1px line", shadow: "none" },
  a11y: { minContrast: "WCAG AA 4.5:1 body text", focusVisible: true, labelsRequired: true },
});
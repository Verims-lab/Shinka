// Shinka design token authority — reconciled with UI/UX Tasarım v1.1 (SRC-03).
// CSS variables in src/index.css mirror `color` via `cssVars` (RGB channels). Light-only; no dark target.
export const DESIGN_TOKENS = Object.freeze({
  status: "APPROVED_UIUX_V1_1",
  source: "SRC-03",
  theme: "light-only",
  color: Object.freeze({
    primaryPlum: "#6F415A", deepPlumText: "#4C263F", mutedMauve: "#93637B", dustyRose: "#D8A5AA",
    blushPink: "#F2D7D4", softLavender: "#E7DCE8", warmIvory: "#FFF8F3", softCream: "#F9EEE8",
    mutedTaupe: "#87757D", divider: "#EDE3E3", white: "#FFFFFF",
  }),
  // CSS variable → color token. Legacy-free aliases used by Foundation classes (plum, ink, line…).
  cssVars: Object.freeze({
    "--shinka-plum": "primaryPlum", "--shinka-plum-deep": "deepPlumText", "--shinka-ink": "deepPlumText",
    "--shinka-mauve": "mutedMauve", "--shinka-rose": "dustyRose", "--shinka-blush": "blushPink",
    "--shinka-lavender": "softLavender", "--shinka-plum-soft": "softLavender", "--shinka-ivory": "warmIvory",
    "--shinka-cream": "softCream", "--shinka-taupe": "mutedTaupe", "--shinka-muted": "mutedTaupe",
    "--shinka-line": "divider", "--shinka-white": "white", "--shinka-surface": "white",
  }),
  typography: Object.freeze({
    heading: '"Cormorant Garamond", Georgia, serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
    headingWeight: 500, bodyWeight: 400, labelWeight: 500,
    headingSizes: [[34, 40], [28, 34], [24, 30], [20, 26]],
    bodySizes: [[17, 25], [15, 22], [13, 18]],
  }),
  pagePaddingX: 20,
  spacing: [4, 8, 12, 16, 20, 24, 32, 40],
  radii: Object.freeze({ sm: 12, md: 16, lg: 20, pill: 999 }),
  touchTargetMin: 44,
  control: Object.freeze({ primaryMinHeight: 52, inputMinHeight: 52, inputPaddingX: 16, primaryRadius: 16, inputRadius: 16, disabledOpacity: 0.45 }),
  card: Object.freeze({ background: "white", radius: 20, padding: 20, border: "1px #EDE3E3", shadow: "0 2px 10px rgba(76,38,63,.05)" }),
  iconFamily: "lucide-react",
  motion: Object.freeze({ transitionMs: 200, continuousDecorative: false }),
  a11y: Object.freeze({ minContrast: "WCAG AA 4.5:1 body text", focusVisible: true, labelsRequired: true, colorNotSoleSignal: true }),
});

export const hexToRgbChannels = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};
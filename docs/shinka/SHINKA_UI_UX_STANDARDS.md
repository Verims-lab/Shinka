# SHINKA — UI / UX Standards

**Document:** SHINKA_UI_UX_STANDARDS.md
**Status:** PROVISIONAL — UI/UX v1.1 not received (OD-001)
**Current BuildMarker:** Buildmarker-001
**Last Updated:** 2026-10-18
**Authoritative Source References:** SRC-03 UI/UX Tasarım v1.1 (NOT RECEIVED); task brief visual direction
**Purpose:** Binding design system for all Shinka surfaces.
**Scope:** Tokens, primitives, accessibility, navigation.
**Implemented:** Provisional tokens (`src/foundation/designTokens.js`, mirrored in `src/index.css`), primitives in `src/components/shinka/`.
**Not Implemented:** Exact approved values, copy dictionary, product screens.
**Open Decisions:** OD-001, OD-005
**External Verification Required:** Reconcile every token with UI/UX v1.1 (H13-006).

## Direction (from brief — binding)
Light-only (no dark theme) · Warm Ivory / Plum family · Cormorant Garamond headings · Inter body/controls · Lucide functional icons · 44×44 minimum touch target. Written UI spec overrides illustrative mockups.

## Provisional tokens
- Color: ivory #FAF6EF, surface #FFFDF9, plum #5C2A50, plum-deep #3F1D38, plum-soft #F2E8EF, ink #2B2128, muted #7A6A74, line #EAE1D7.
- Type scale (px): caption 12, body 14, lead 16, h3 24, h2 32, h1 44; weights 400/500/600.
- Spacing: 4, 8, 12, 16, 24, 32, 48, 64. Radii: 8 / 12 / 20 / pill.
- Controls: button & input height 48; minimum touch target 44.
- Card: radius 20, 1px line border, no shadow. Motion: 150 ms fast, 220 ms base.

## Primitives
ShinkaButton, ShinkaCard, StatusBadge, StatePanel (LOADING/EMPTY/ERROR+RETRY/SUCCESS/DISABLED), PageContainer, PageHeader, KeyValueGrid, internal CaseRow (expandable evidence).

## Accessibility
Accessible name on every control; focus-visible outline; AA contrast; no horizontal overflow at 360 px; state changes announced via role="status"/"alert".

## Navigation (future)
Bottom: Home · Calendar · Pattern. You via top-right profile icon (not bottom nav). Internal tooling never appears in customer navigation.
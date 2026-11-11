# 070 — ON-02 sign-in visibility: investigation and first-viewport priority

Buildmarker-070 / HC-069.0. Repository state: `f87af36` plus the working-tree type fix in `src/foundation/probes/inspectAuthShell.js`.

## 1. What was actually running

The published origin `https://shinka-rhythm-flow.base44.app` served **Buildmarker-069** during this package. Two live reads establish what the shipped bundle renders for a visitor with no session:

- `GET /login` (public entry, renders the real anonymous ON-02) contained `#age-declaration` (type checkbox, with its label), `[data-provider="apple"]` and `[data-provider="google"]`, each with a `min-h-[52px]` primary button class, plus the `2 of 5` counter and the `Welcome` heading.
- `GET /auth-shell-probe` (the app's own committed shell probe, no session created) reported `data-probe-status="READY"` and `data-probe-lifecycle="COMMIT_VERIFIED"`, which the probe only sets when the shell exists, the state is `UNAUTHENTICATED_SIGN_IN`, both provider buttons have a measured height greater than zero and the container has a measured width.

So the anonymous ON-02 markup and its committed geometry are present in the published build. The defect the owner reports is therefore **not** a missing component in `SignIn.jsx`; it is the presentation budget above the controls, plus one product-state confusion:

1. **Layout budget.** `SIGN_IN_ART_SPACE` allowed the empty artwork slot to grow to 240px, and ON-02 used the generic `space-y-6 py-6` rhythm. The slot paints nothing (065 moved the composition into the shared backdrop), so its full height is dead space above the declaration. 068 already measured the consequence on a 320×568 viewport: before its change the document was 780px tall and the providers sat at y=612–732, far below the fold. Only a fraction of the viewport was ever reclaimed, so a short viewport — the Base44 Preview frame, a small phone, a landscape frame or enlarged text — pushes the declaration and both buttons below the visible area. Nothing in the DOM is missing; the controls simply are not where the user looks.
2. **State confusion.** The 2/5 counter is shared by both Welcome variants. For a verified session the same screen renders **only** Continue (`061` decision), with no declaration and no provider actions. Anyone testing while signed in — the normal case in the editor Preview — sees "Hoş geldin · 2 of 5" without the three controls and reasonably reads it as a missing sign-in form.

## 2. Change

- `SIGN_IN_ART_SPACE` is now `{ flex: 1 1 0px, minHeight: 0, maxHeight: 48 }`: the gap still breathes on tall phones, may collapse to zero, and can no longer dominate the screen.
- Anonymous ON-02 uses a compact stack (`space-y-3 py-2`) instead of `space-y-6 py-6`, saving 80px of dead vertical space above and around the form. Every other numbered step keeps its existing rhythm.
- No sign-in, session, state-resolution, consent or provider code changed. `beginProviderAuth` still refuses any provider call when `ageConfirmed !== true`, and a verified session still receives Continue.

## 3. Permanent protection

- **Health case H13-021** (STATIC, catalog HC-069.0, 186 cases): `inspectSignInControls` reads the shipped sources at build time and requires the anonymous branch to render `SignIn`, the unchecked `age-declaration` checkbox, `data-provider="apple"`, `data-provider="google"`, the age gate inside `beginProviderAuth`, and an artwork-slot cap of at most 48px.
- **Real-App render guard:** `checkSignInLayout` (used by `checkAuthFirstOnboarding` and the published smoke) now asserts the empty `.shinka-onboarding-art-space` height is at most 48px, in addition to its existing state, step, provider order, touch-target, hit-test, viewport and safe-padding assertions.
- **Running-app evidence:** `/auth-shell-probe` now publishes `data-probe-viewport` (`IN_VIEW` / `OFFSCREEN`) computed from the committed geometry of the declaration and both buttons inside the visible viewport. `inspectAuthShell` returns the same `inView` value.

## 4. Verification performed in this package

- Live published reads above (`/login` DOM, `/auth-shell-probe` status) — the shipped 069 bundle contains the three controls.
- Local gates on the final tree, all PASS: `npm run typecheck` (no diagnostics after the `HTMLInputElement` narrowing in `inspectAuthShell`), `npm run lint` (no findings), `npm run build` (`dist/index.html` written), `node scripts/checkOnboardingLayers.mjs` (exit 0), `npm run health:repo` and the static-evidence check (`signIn.artSlotCap=48`, `artSlotCapped=true`, marker single-source, docs aligned, ledger generated history matches).
- `npm run test:foundation` static scope PASS: the actual `onboarding` and `you` TS entry handlers reject all 4 negative requests with zero quota/provider/secret access, and both SDK loopback checks (`SDK02`, `SDK03`) pass. `hostedCleanupVerified` and `hostedMutationVerified` remain false: no hosted mutation is claimed.
- The browser matrices (`checkAuthFirstOnboarding`, `checkOnboardingLayers`, `checkPublishedOnboarding`, the 320/360/390/430 onboarding layer matrix) require a Playwright browser binary that this sandbox cannot install; they are the gates to run in the release environment and are **NOT_RUN** here. Physical-device acceptance is H13-013 and remains open.

## 5. What the owner sees after publication

The next publication carries Buildmarker-070. The published origin then answers `/auth-shell-probe` with `data-probe-status="READY"` **and** `data-probe-viewport="IN_VIEW"`; that pair is the machine-checkable statement that the 18+ declaration and both provider buttons are inside the visible viewport of the running app. A signed-out browser or private window is required to see the anonymous Welcome; a signed-in session intentionally shows Continue only.

## 6. Follow-up: why the preview shows no provider buttons

The reported screenshot is `state="UNAUTHENTICATED_SIGN_IN"` rendered with `authenticated === true`: title `signIn` ("Hoş geldin"), subtitle `signInSubtitle`, step 2/5, and the single `continue` action from `OnboardingScreen`'s authenticated branch. The provider actions only exist in the anonymous branch (`SignIn.jsx`), so with a verified session they are absent by design, not covered by the backdrop: the same card renders Continue, so no layer sits above the card.

Change (2026-11-11 owner request): the authenticated Welcome now renders a secondary `signOut` action under Continue, wired in `src/pages/Onboarding.jsx` to the existing `AuthContext.logout()` boundary, which returns to `/login` and therefore loads the anonymous ON-02 with the declaration and both providers. The anonymous branch, the age gate, `resume`, copy of the other steps and the layout caps are unchanged.

Local gates on this follow-up: `npm run typecheck` (clean), `npm run lint` (clean), `npm run build` (exit 0, `dist/index.html` written), `node scripts/checkOnboardingLayers.mjs` (exit 0), `npm run health:repo` (exit 0), `node scripts/recordBuild.mjs --check` (5 packages verified), EN/TR copy parity 91/91 keys. Signed-out rendering of the providers in a running app remains the `/auth-shell-probe` `IN_VIEW` check after publication, and physical-device acceptance remains H13-013.

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import OnboardingIntro from "@/features/onboarding/OnboardingIntro";
import PageContainer from "@/components/shinka/PageContainer";
import ShinkaCard from "@/components/shinka/ShinkaCard";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import SignIn from "./SignIn";
import { ProfileForm, CycleForm } from "./OnboardingForms";
import FieldError from "./FieldError";
import { beginProviderAuth } from "@/services/authService";
import { resolveLanguage } from "@/foundation/i18n/strings";
import { onboardingCopy } from "@/foundation/i18n/onboardingCopy";
import { BUILD_MARKER } from "@/foundation/buildMarker";
import {
  optionalName,
} from "../../../base44/shared/onboardingValidation.js";
import { onboardingRequest, assertOnboardingProgress, isOnboardingPrivacyRestriction } from "@/services/onboardingService";
import FirstShinka from '@/features/daily/FirstShinka';
// Single screen metadata map (SRC-03 presentation + 2026-11-09 auth-first user decision). Five numbered main steps;
// Preparation/inactive are unnumbered. Back stays within the current session mode.
// ON-05 → ON-04 preserves form values for an explicit profile correction.
const SCREENS = {
  UNAUTHENTICATED_INTRO: { step: 1, title: "intro" },
  UNAUTHENTICATED_SIGN_IN: { step: 2, title: "signIn", subtitle: "signInSubtitle", back: "UNAUTHENTICATED_INTRO" },
  AUTHENTICATED_NAME_REQUIRED: { step: 3, title: "nameTitle", subtitle: "nameSubtitle" },
  AUTHENTICATED_PROFILE_REQUIRED: { step: 4, title: "aboutTitle", subtitle: "aboutSubtitle" },
  AUTHENTICATED_CYCLE_STEP: { step: 5, title: "cycle", subtitle: "cycleSubtitle", back: "AUTHENTICATED_PROFILE_REQUIRED" },
  FIRST_SHINKA_DEPENDENCY: { title: "preparation" },
  INACTIVE_ACCOUNT: { title: "inactive" },
};

const ONBOARDING_VIEWPORT_HEIGHT = "calc(100dvh - max(24px, var(--safe-top)) - max(24px, var(--safe-bottom)))";
// Scale ON-01 spacing inside the safe content area, above the 52px CTA.
const INTRO_USABLE_HEIGHT = `max(0px, calc(${ONBOARDING_VIEWPORT_HEIGHT} - 52px))`;
const INTRO_LAYOUT = {
  height: "calc(100dvh - var(--shinka-brand-space, max(24px, var(--safe-top))) - max(24px, var(--safe-bottom)))",
  minHeight: "min-content",
};
const CENTERED_CONTENT = "mx-auto max-w-md";

/** @param {{state:string,initialLanguage?:string,today?:string,profile?:any,request?:Function,dailyRequest?:Function,onState?:Function,authenticated?:boolean,onRestricted?:Function,onSignOut?:Function|null,authenticate?:typeof beginProviderAuth,dependencies?:string[]}} props */
export default function OnboardingScreen({
  state,
  initialLanguage = undefined,
  authenticated = false,
  today = null,
  profile = null,
  request = onboardingRequest,
  dailyRequest = undefined,
  onState = () => {},
  onRestricted = () => {},
  authenticate = beginProviderAuth,
  dependencies = [],
  onSignOut = null,
}) {
  const language = resolveLanguage(initialLanguage);
  const [canReturnToName, setCanReturnToName] = useState(false);
  const [name, setName] = useState(
      () => profile?.display_name ?? "",
    ),
    [form, setForm] = useState({
      birth_date: profile?.birth_date || "",
      birth_time: profile?.birth_time || "",
      period_start_date: "",
      period_duration_days: "",
      initial_cycle_length_days: "",
      health_consent: false,
    });
  const nameDraft = useRef(name);
  nameDraft.current = name;
  const [birthplace, setBirthplace] = useState({
    selection: profile?.birthplace_geonames_id ? profile : null,
    incomplete: false,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const title = useRef(null),
    lock = useRef(false),
    action = useRef(null),
    mounted = useRef(false),
    generation = useRef(0);
  const t = (key) => onboardingCopy(key, language);
  useEffect(() => {
    mounted.current = true;
    const invalidate = () => { generation.current++; };
    window.addEventListener('shinka-session-ended', invalidate);
    return () => { mounted.current = false; invalidate(); window.removeEventListener('shinka-session-ended', invalidate); };
  }, []);
  useEffect(() => {
    setError(null);
    const heading = title.current;
    if (state === "UNAUTHENTICATED_INTRO") {
      heading?.focus();
    } else {
      heading?.ownerDocument.defaultView?.scrollTo(0, 0);
      heading?.focus({ preventScroll: true });
    }
  }, [state]);
  useEffect(() => {
    if (error?.field && !busy)
      // Date input focus can reopen the native picker on iOS. Announce/focus its
      // adjacent error instead; editing remains an explicit user action.
      title.current?.ownerDocument.getElementById(error.field === 'birth_date' ? 'birth_date-error' : error.field)?.focus();
  }, [error, busy]);
  const showError = (e) => {
    if (isOnboardingPrivacyRestriction(e.code)) { onRestricted(e.code); return; }
    setError({
      code: e.code || "ONBOARDING_OPERATION_FAILED",
      field: e.field || null,
    });
  };
  const run = async (fn) => {
    if (lock.current) return;
    const ticket = generation.current;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      if (mounted.current && ticket === generation.current) showError(e);
    } finally {
      if (mounted.current && ticket === generation.current) { lock.current = false; setBusy(false); }
    }
  };
  const submit = async (actionName, payload) => {
    const ticket = generation.current;
    const key = JSON.stringify([actionName, payload]);
    if (action.current?.key !== key)
      action.current = { key, id: crypto.randomUUID() };
    const result = await request(actionName, {
      ...payload,
      ...(actionName === 'skipCycle' ? {} : { action_id: action.current.id }),
    });
    if (!mounted.current || ticket !== generation.current) return;
    assertOnboardingProgress(actionName, payload, result);
    if (result.profile) {
      setCanReturnToName(false);
      setName(result.profile.display_name || "");
      setForm(value => ({ ...value, birth_date: result.profile.birth_date || "", birth_time: result.profile.birth_time || "" }));
    }
    onState(result.state, result);
  };
  const update = (key, value) => {
    setForm((v) => ({ ...v, [key]: value }));
    setError(null);
  };
  const fieldError = (key) => <FieldError name={key} error={error} t={t} />;
  const formProps = { form, update, error, busy, t, today, run, submit };
  const screen = SCREENS[state];
  const intro = state === "UNAUTHENTICATED_INTRO";
  const anonymousSignIn = state === "UNAUTHENTICATED_SIGN_IN";
  const anonymous = intro || anonymousSignIn;
  if (!screen || anonymous === authenticated) return null;
  const step = screen.step;
  const airy = Boolean(step);
  const numbered = airy && !intro;
  // Only an unsaved name choice made in this mounted form can be revisited.
  const back = state === "AUTHENTICATED_PROFILE_REQUIRED" && canReturnToName && !profile
    ? "AUTHENTICATED_NAME_REQUIRED"
    : screen.back;
  const advanceName = (value) => {
    setName(value ?? "");
    setCanReturnToName(true);
    onState("AUTHENTICATED_PROFILE_REQUIRED");
  };
  const body = () => {
    if (state === "UNAUTHENTICATED_INTRO")
      return (
        <OnboardingIntro
          t={t}
          onBegin={() => run(async () => onState("UNAUTHENTICATED_SIGN_IN"))}
        />
      );
    if (state === "AUTHENTICATED_NAME_REQUIRED")
      return (
        <>
          <div className="shinka-framed-field shinka-name-field">
            <label htmlFor="display_name" className="block text-shinka-small text-shinka-plum">{t("display_name")}</label>
            <input
              id="display_name"
              autoComplete="given-name"
              className="block min-h-11 w-full min-w-0 bg-transparent text-[17px] leading-[1.5] text-shinka-ink"
              value={name}
              onChange={(e) => {
                nameDraft.current = e.target.value;
                setName(e.target.value);
                setError(null);
              }}
              aria-invalid={error?.field === "display_name"}
              aria-describedby={
                error?.field === "display_name" ? "display_name-error" : undefined
              }
            />
          </div>
          {fieldError("display_name")}
          <ShinkaButton
            className="w-full"
            onClick={() =>
              run(async () => advanceName(optionalName(nameDraft.current)))
            }
          >
            {t("continue")}
          </ShinkaButton>
          <ShinkaButton
            variant="ghost"
            className="w-full"
            disabled={busy || Boolean(name.trim())}
            onClick={() => run(async () => {
              if (nameDraft.current.trim()) return;
              advanceName(null);
            })}
          >
            {t("preferNot")}
          </ShinkaButton>
        </>
      );
    if (anonymousSignIn)
      return <SignIn language={language} authenticate={authenticate} onBusy={setBusy} />;
    if (state === "AUTHENTICATED_PROFILE_REQUIRED")
      return (
        <ProfileForm
          {...formProps}
          name={name}
          birthplace={birthplace}
          language={language}
          request={request}
          onPlaceChange={(value) => {
            setBirthplace(value);
            setError(null);
          }}
        />
      );
    if (state === "AUTHENTICATED_CYCLE_STEP")
      return (
        <CycleForm
          {...formProps}
          onSkip={() => submit("skipCycle", {})}
        />
      );
    if (state === "FIRST_SHINKA_DEPENDENCY")
      return (
        <FirstShinka language={language} request={dailyRequest} onReady={result => onState(result.state, { ...result, uiLanguage: language })}/>
      );
    return null;
  };
  const message = error
    ? t(error.code) === "COPY_KEY_MISSING"
      ? t("saveError")
      : t(error.code)
    : null;
  return (
    <PageContainer className={numbered ? "shinka-onboarding shinka-onboarding-numbered" : "shinka-onboarding"} surface="section">
      {numbered && (
        <header className="shinka-progress-slot" lang={language}>
          <div className="flex items-center gap-1" data-onboarding-progress>
            <ShinkaButton variant="ghost" aria-label={t("back")} data-onboarding-back className="shrink-0" style={{ paddingInline: 0 }} disabled={!back || busy} onClick={back ? () => onState(back) : undefined}>
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </ShinkaButton>
            <p className="min-w-0 break-words text-shinka-small leading-tight text-shinka-taupe" data-onboarding-step={step}>
              {t("stepOf").replace("{n}", String(step))}
            </p>
          </div>
        </header>
      )}
      <main
        className={`${CENTERED_CONTENT} ${intro ? "flex flex-col" : "space-y-3"}`}
        style={intro ? INTRO_LAYOUT : undefined}
        data-onboarding-step={intro ? step : undefined}
        data-onboarding-state={state}
        data-shinka-build={BUILD_MARKER}
        lang={language}
      >
        <>
          {dependencies.length > 0 && (
            <div role="status" className="break-words text-shinka-small">
              {dependencies.join(" · ")}
            </div>
          )}
          {intro && (
            <div aria-hidden="true" style={{ flexGrow: 1, maxHeight: `calc(${INTRO_USABLE_HEIGHT} / 10)` }} />
          )}
          <div
            className={airy ? "space-y-2 text-center" : ""}
            style={intro ? { marginBlockEnd: `calc(${INTRO_USABLE_HEIGHT} / 40)` } : undefined}
          >
            <h1
              ref={title}
              tabIndex={-1}
              className={`font-heading ${intro ? "text-shinka-h2" : "text-shinka-h1"} text-shinka-plum-deep outline-none ${airy ? "text-center" : ""} ${step === 1 || step === 4 ? "shinka-unframed-title" : ""}`}
            >
              {t(screen.title)}
            </h1>
            {screen.subtitle && <p className="text-shinka-taupe">{t(screen.subtitle)}</p>}
          </div>
          <ShinkaCard surface={airy || state === 'FIRST_SHINKA_DEPENDENCY' ? 'plain' : 'card'} padded={!airy} className={airy ? "shinka-intro-shell" : ""}>
            <div className="space-y-5" aria-busy={busy}>
              {body()}
              {error && !error.field && (
                <div role="alert">
                  <p>{message}</p>
                  <p
                    className="mt-2 break-words text-shinka-small"
                    data-onboarding-error={error.code}
                  >
                    {error.code}
                  </p>
                </div>
              )}
              {authenticated && onSignOut && state !== "INACTIVE_ACCOUNT" && (
                <ShinkaButton variant="secondary" className="w-full" disabled={busy} onClick={() => onSignOut()}>{t("signOut")}</ShinkaButton>
              )}
            </div>
          </ShinkaCard>
        </>
      </main>
    </PageContainer>
  );
}

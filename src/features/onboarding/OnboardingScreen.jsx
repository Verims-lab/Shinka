import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import OnboardingIntro, { IntroArt } from "@/features/onboarding/OnboardingIntro";
import PageContainer from "@/components/shinka/PageContainer";
import ShinkaCard from "@/components/shinka/ShinkaCard";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import ShinkaInput from "@/components/shinka/ShinkaInput";
import SignIn from "./SignIn";
import { ProfileForm, CycleForm } from "./OnboardingForms";
import FieldError from "./FieldError";
import { beginProviderAuth } from "@/services/authService";
import {
  readPendingName,
  savePendingName,
  clearPendingName,
} from "./pendingName";
import { resolveLanguage } from "@/foundation/i18n/strings";
import { onboardingCopy } from "@/foundation/i18n/onboardingCopy";
import {
  optionalName,
  OnboardingError,
} from "../../../base44/shared/onboardingValidation.js";
import { onboardingRequest, assertOnboardingProgress } from "@/services/onboardingService";
import FirstShinka from '@/features/daily/FirstShinka';
const DEFAULT_PENDING = {
  read: readPendingName,
  save: savePendingName,
  clear: clearPendingName,
};
// Single screen metadata map (SRC-03 + 2026-10-27 user decision). Five numbered main steps;
// preparation/inactive are unnumbered interstitials. `back` is a pure local view change:
// no logout, no OAuth restart, no write. ON-05 → ON-04 keeps the form values; re-saving
// ON-04 is allowed server-side only while onboarding is unfinished.
const SCREENS = {
  UNAUTHENTICATED_INTRO: { step: 1, title: "intro" },
  UNAUTHENTICATED_NAME: { step: 2, title: "nameTitle", subtitle: "nameSubtitle", back: "UNAUTHENTICATED_INTRO" },
  UNAUTHENTICATED_SIGN_IN: { step: 3, title: "signIn", subtitle: "signInSubtitle", back: "UNAUTHENTICATED_NAME" },
  AUTHENTICATED_PROFILE_REQUIRED: { step: 4, title: "aboutTitle", subtitle: "aboutSubtitle", back: "UNAUTHENTICATED_SIGN_IN" },
  AUTHENTICATED_CYCLE_STEP: { step: 5, title: "cycle", subtitle: "cycleSubtitle", back: "AUTHENTICATED_PROFILE_REQUIRED" },
  FIRST_SHINKA_DEPENDENCY: { title: "preparation", back: "UNAUTHENTICATED_SIGN_IN" },
  INACTIVE_ACCOUNT: { title: "inactive" },
};
/** @param {{state:string,initialLanguage?:string,today?:string,profile?:any,request?:Function,dailyRequest?:Function,onState?:Function,authenticated?:boolean,pending?:typeof DEFAULT_PENDING,authenticate?:typeof beginProviderAuth,dependencies?:string[]}} props */
export default function OnboardingScreen({
  state,
  initialLanguage = undefined,
  authenticated = false,
  today = null,
  profile = null,
  request = onboardingRequest,
  dailyRequest = undefined,
  onState = () => {},
  pending = DEFAULT_PENDING,
  authenticate = beginProviderAuth,
  dependencies = [],
}) {
  const language = resolveLanguage(initialLanguage);
  const resume = useRef("AUTHENTICATED_PROFILE_REQUIRED");
  const [name, setName] = useState(
      () => profile ? profile.display_name ?? "" : pending.read() ?? "",
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
    title.current?.focus();
  }, [state]);
  useEffect(() => {
    if (error?.field && !busy)
      title.current?.ownerDocument.getElementById(error.field)?.focus();
  }, [error, busy]);
  const showError = (e) => {
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
    if (result.persisted && actionName === "saveProfile") pending.clear();
    if (result.profile) {
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
  const screen = SCREENS[state] || {};
  const step = screen.step;
  const airy = Boolean(step);
  const body = () => {
    if (state === "UNAUTHENTICATED_INTRO")
      return (
        <OnboardingIntro
          t={t}
          onBegin={() => run(async () => onState("UNAUTHENTICATED_NAME"))}
        />
      );
    if (state === "UNAUTHENTICATED_NAME")
      return (
        <>
          <label htmlFor="display_name">{t("display_name")}</label>
          <ShinkaInput
            id="display_name"
            autoComplete="given-name"
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
          {fieldError("display_name")}
          <ShinkaButton
            className="w-full"
            onClick={() =>
              run(async () => {
                const value = optionalName(nameDraft.current);
                if (!pending.save(value) && value)
                  throw new OnboardingError("TRANSIENT_STORAGE_UNAVAILABLE");
                onState("UNAUTHENTICATED_SIGN_IN");
              })
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
              pending.clear();
              setName("");
              onState("UNAUTHENTICATED_SIGN_IN");
            })}
          >
            {t("preferNot")}
          </ShinkaButton>
        </>
      );
    if (state === "UNAUTHENTICATED_SIGN_IN")
      return authenticated
        ? <ShinkaButton className="w-full" onClick={() => onState(resume.current)}>{t("continue")}</ShinkaButton>
        : <SignIn language={language} authenticate={authenticate} onBusy={setBusy} />;
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
    <PageContainer className="shinka-onboarding">
      <main
        className="mx-auto max-w-md space-y-6 py-6"
        data-onboarding-state={state}
        lang={language}
      >
        <div className="grid grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)] items-center gap-2">
          <div>
            {screen.back && (
              <ShinkaButton variant="ghost" aria-label={t("back")} data-onboarding-back disabled={busy} onClick={() => {
                if (state === "FIRST_SHINKA_DEPENDENCY" || state === "AUTHENTICATED_PROFILE_REQUIRED") resume.current = state;
                onState(screen.back);
              }}>
                <ChevronLeft aria-hidden="true" className="h-5 w-5" />
              </ShinkaButton>
            )}
          </div>
          <span className="font-heading text-3xl text-shinka-plum-deep">Shinka</span>
          <div aria-hidden="true" />
        </div>
        <>
          {dependencies.length > 0 && (
            <div role="status" className="break-words text-shinka-small">
              {dependencies.join(" · ")}
            </div>
          )}
          {step && (
            <p aria-hidden="true" className="text-shinka-small text-shinka-taupe" data-onboarding-step={step}>
              {t("stepOf").replace("{n}", String(step))}
            </p>
          )}
          {airy && <IntroArt />}
          <div className={airy ? "space-y-2 text-center" : ""}>
            <h1
              ref={title}
              tabIndex={-1}
              className={`font-heading text-shinka-h1 text-shinka-plum-deep outline-none ${airy ? "text-center" : ""}`}
            >
              {t(screen.title)}
            </h1>
            {screen.subtitle && <p className="text-shinka-taupe">{t(screen.subtitle)}</p>}
          </div>
          <ShinkaCard className={airy ? "shinka-intro-shell" : ""}>
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
            </div>
          </ShinkaCard>
        </>
      </main>
    </PageContainer>
  );
}

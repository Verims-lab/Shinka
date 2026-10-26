import { useEffect, useRef, useState } from "react";
import OnboardingIntro, { IntroArt } from "@/features/onboarding/OnboardingIntro";
import PageContainer from "@/components/shinka/PageContainer";
import ShinkaCard from "@/components/shinka/ShinkaCard";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import ShinkaInput from "@/components/shinka/ShinkaInput";
import SignIn from "./SignIn";
import { ProfileForm, CycleForm, FieldError } from "./OnboardingForms";
import { beginProviderAuth } from "@/services/authService";
import {
  readPendingName,
  savePendingName,
  clearPendingName,
} from "./pendingName";
import { onboardingCopy } from "@/foundation/i18n/onboardingCopy";
import {
  optionalName,
  OnboardingError,
} from "../../../base44/shared/onboardingValidation.js";
import { onboardingRequest } from "@/services/onboardingService";
import FirstShinka from '@/features/daily/FirstShinka';
const DEFAULT_PENDING = {
  read: readPendingName,
  save: savePendingName,
  clear: clearPendingName,
};
const TITLES = {
  UNAUTHENTICATED_INTRO: "intro",
  UNAUTHENTICATED_NAME: "nameTitle",
  UNAUTHENTICATED_SIGN_IN: "signIn",
  AUTHENTICATED_PROFILE_REQUIRED: "aboutTitle",
  AUTHENTICATED_CYCLE_STEP: "cycle",
  FIRST_SHINKA_DEPENDENCY: "preparation",
  INACTIVE_ACCOUNT: "inactive",
};
// SRC-03: five main steps; preparation (and inactive) is a separate interstitial without a number.
const STEP_NUMBER = {
  UNAUTHENTICATED_INTRO: 1,
  UNAUTHENTICATED_NAME: 2,
  UNAUTHENTICATED_SIGN_IN: 3,
  AUTHENTICATED_PROFILE_REQUIRED: 4,
  AUTHENTICATED_CYCLE_STEP: 5,
};
/** @param {{state:string,initialLanguage?:string,today?:string,profile?:any,request?:Function,dailyRequest?:Function,onState?:Function,onLanguage?:Function,pending?:typeof DEFAULT_PENDING,authenticate?:typeof beginProviderAuth,dependencies?:string[],renderProfileAccess?:(language:string)=>import("react").ReactNode}} props */
export default function OnboardingScreen({
  state,
  initialLanguage = "en",
  today = null,
  profile = null,
  request = onboardingRequest,
  dailyRequest = undefined,
  onState = () => {},
  onLanguage = () => {},
  pending = DEFAULT_PENDING,
  authenticate = beginProviderAuth,
  dependencies = [],
  renderProfileAccess = () => null,
}) {
  const [language, setLanguage] = useState(initialLanguage),
    [name, setName] = useState(
      () => pending.read() ?? profile?.display_name ?? "",
    ),
    [form, setForm] = useState({
      birth_date: profile?.birth_date || "",
      birth_time: profile?.birth_time || "",
      period_start_date: "",
      period_duration_days: "",
      initial_cycle_length_days: "",
      health_consent: false,
    });
  const [birthplace, setBirthplace] = useState({
    selection: profile?.birthplace_geonames_id ? profile : null,
    incomplete: false,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const title = useRef(null),
    lock = useRef(false),
    action = useRef(null);
  const t = (key) => onboardingCopy(key, language);
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
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      showError(e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const submit = async (actionName, payload) => {
    const key = JSON.stringify([actionName, payload]);
    if (action.current?.key !== key)
      action.current = { key, id: crypto.randomUUID() };
    const result = await request(actionName, {
      ...payload,
      action_id: action.current.id,
    });
    if (result.persisted && actionName === "saveProfile") pending.clear();
    if (result.profile) setName(result.profile.display_name || "");
    onState(result.state, result);
  };
  const update = (key, value) => {
    setForm((v) => ({ ...v, [key]: value }));
    setError(null);
  };
  const fieldError = (key) => <FieldError name={key} error={error} t={t} />;
  const formProps = { form, update, error, busy, t, today, run, submit };
  const intro = state === "UNAUTHENTICATED_INTRO";
  const personal = state === "AUTHENTICATED_PROFILE_REQUIRED";
  const airy = intro || personal;
  const step = STEP_NUMBER[state];
  const body = () => {
    if (state === "UNAUTHENTICATED_INTRO")
      return (
        <OnboardingIntro
          t={t}
          onBegin={() => onState("UNAUTHENTICATED_NAME")}
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
                const value = optionalName(name);
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
            onClick={() => {
              pending.clear();
              setName("");
              onState("UNAUTHENTICATED_SIGN_IN");
            }}
          >
            {t("preferNot")}
          </ShinkaButton>
        </>
      );
    if (state === "UNAUTHENTICATED_SIGN_IN")
      return <SignIn language={language} authenticate={authenticate} />;
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
          onSkip={async () => {
            const result = await request("skipCycle");
            onState(result.state, result);
          }}
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-heading text-2xl">Shinka</span>
          <div className="flex flex-wrap items-center gap-1">
            {["tr", "en"].map((lang) => (
              <ShinkaButton
                key={lang}
                variant="ghost"
                aria-pressed={language === lang}
                onClick={() => {
                  setLanguage(lang);
                  onLanguage(lang);
                }}
              >
                {lang.toUpperCase()}
              </ShinkaButton>
            ))}
            {!personal && renderProfileAccess(language)}
          </div>
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
              {t(TITLES[state])}
            </h1>
            {personal && <p className="text-shinka-taupe">{t("aboutSubtitle")}</p>}
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
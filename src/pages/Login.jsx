import { useState } from "react";
import { Apple } from "lucide-react";
import PageContainer from "@/components/shinka/PageContainer";
import ShinkaCard from "@/components/shinka/ShinkaCard";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { beginProviderAuth } from "@/services/authService";
import { AUTH_ERROR_CODES } from "@/foundation/authErrors";
import { t } from "@/foundation/i18n/strings";

// Foundation provider shell only. Onboarding/age checks belong to the later product package.
export default function Login() {
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const signIn = async (provider) => {
    setBusy(true); setErrorCode("");
    const result = await beginProviderAuth(provider, safeReturnTo());
    if (!result.ok && result.code !== AUTH_ERROR_CODES.CANCELLED) setErrorCode(result.code);
    setBusy(false);
  };
  return (
    <PageContainer>
      <div className="max-w-md mx-auto py-10">
        <ShinkaCard title={t("auth.title")}>
          <div className="space-y-4" data-auth-shell>
            <p className="text-shinka-body text-shinka-taupe">{t("auth.intro")}</p>
            <ShinkaButton className="w-full" onClick={() => signIn("apple")} disabled={busy} data-provider="apple">
              <Apple aria-hidden="true" className="h-5 w-5" />{t("auth.apple")}
            </ShinkaButton>
            <ShinkaButton className="w-full" onClick={() => signIn("google")} disabled={busy} data-provider="google">
              <GoogleIcon className="h-5 w-5" />{t("auth.google")}
            </ShinkaButton>
            {errorCode && <p role="alert" data-error-code={errorCode} className="text-shinka-body text-shinka-ink">{t(`auth.${errorCode}`)}</p>}
          </div>
        </ShinkaCard>
      </div>
    </PageContainer>
  );
}

import { useAuth } from "@/lib/AuthContext";
import PageContainer from "@/components/shinka/PageContainer";
import ShinkaButton from "@/components/shinka/ShinkaButton";
import { t } from "@/foundation/i18n/strings";

// Transient session verification failure: no sign-in buttons, no redirect.
export default function SessionRetry({ language = undefined }) {
  const { checkUserAuth, isRefreshingAuth, authError } = useAuth();
  const lang = language || (document.documentElement.lang?.startsWith("tr") ? "tr" : "en");
  return <PageContainer>
    <div role="alert" data-session-unverified data-error-stage={authError?.diagnostic?.stage} data-request-id={authError?.diagnostic?.requestId} data-http-status={authError?.diagnostic?.httpStatus} data-error-duration={authError?.diagnostic?.durationMs} className="space-y-4 py-10 text-center">
      <p className="text-shinka-ink">{t("session.unverified", lang)}</p>
      <ShinkaButton onClick={() => void checkUserAuth()} disabled={isRefreshingAuth}>{t("session.retry", lang)}</ShinkaButton>
    </div>
  </PageContainer>;
}
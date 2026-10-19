import { useEffect, useState, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import PageContainer from "@/components/shinka/PageContainer";
import StatePanel from "@/components/shinka/StatePanel";
import { internalLanguage, internalLinkClass } from "@/foundation/internalNavigation";
import { t } from "@/foundation/i18n/strings";

export default function AdminGate() {
  const { isAdmin, isRefreshingAuth, checkUserAuth } = useAuth();
  const { pathname, state } = useLocation();
  const [checkedPath, setCheckedPath] = useState(null);
  const previouslyAllowed = useRef(false);
  const language = internalLanguage(state);
  useEffect(() => {
    let current = true;
    void checkUserAuth().then(() => { if (current) setCheckedPath(pathname); });
    return () => { current = false; };
  }, [pathname, checkUserAuth]);
  const pending = checkedPath !== pathname || isRefreshingAuth;
  if (!isRefreshingAuth) previouslyAllowed.current = isAdmin;
  // Keep an already authorized tool mounted but inaccessible while rechecking
  // this same route, so a background refresh does not discard an active run.
  const retainTool = checkedPath === pathname && (isAdmin || (isRefreshingAuth && previouslyAllowed.current));
  if (pending || retainTool) return <>
    {pending && <PageContainer><StatePanel state="LOADING" message={t("admin.checking", language)} /></PageContainer>}
    {retainTool && <div hidden={pending} aria-hidden={pending || undefined} {...(pending ? { inert: "" } : {})}><Outlet /></div>}
  </>;
  if (!isAdmin) return <PageContainer>
    <StatePanel state="DISABLED" message={t("admin.unavailable", language)} code="FORBIDDEN" />
    <Link to="/" state={{ language }} className={`${internalLinkClass} border-shinka-line text-shinka-plum`}>{t("admin.returnApp", language)}</Link>
  </PageContainer>;
  return null;
}

import { NavLink, useLocation } from "react-router-dom";
import { ADMIN_PANEL_PATH, INTERNAL_TOOLS, internalLanguage, internalLinkClass } from "@/foundation/internalNavigation";
import { t } from "@/foundation/i18n/strings";

export default function InternalNav() {
  const location = useLocation();
  const language = internalLanguage(location.state);
  const links = [{ path: ADMIN_PANEL_PATH, titleKey: "admin.panel" }, ...INTERNAL_TOOLS, { path: "/", titleKey: "admin.returnApp" }];
  return <nav aria-label={t("admin.navigation", language)} className="flex flex-wrap gap-2">
    {links.map(({ path, titleKey }) => <NavLink key={path} to={path} end state={{ language }}
      className={({ isActive }) => `${internalLinkClass} ${isActive ? "bg-shinka-plum text-shinka-surface border-shinka-plum" : "bg-shinka-surface text-shinka-plum border-shinka-line"}`}>
      {t(titleKey, language)}
    </NavLink>)}
  </nav>;
}

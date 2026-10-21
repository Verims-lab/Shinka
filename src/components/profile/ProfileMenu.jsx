import { useLayerHistory } from "@/features/mobile/useLayerHistory";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import { ADMIN_PANEL_PATH } from "@/foundation/internalNavigation";
import { t } from "@/foundation/i18n/strings";

// One-item navigation menu. Authorization is supplied by ProfileAccess.
export default function ProfileMenu({ enabled = false, language = undefined }) {
  const [open, setOpen] = useState(false);
  const container = useRef(null), trigger = useRef(null), item = useRef(null);
  const menuId = useId();
  const leaveLayer = useLayerHistory(open && enabled, () => { setOpen(false); trigger.current?.focus(); }, container);
  useEffect(() => { if (!enabled) setOpen(false); }, [enabled]);
  useEffect(() => {
    if (!open || !enabled) return;
    item.current?.focus();
    const dismiss = event => { if (!container.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open, enabled]);
  const closeAndFocus = () => { setOpen(false); trigger.current?.focus(); };
  const menuKey = event => {
    if (event.key === "Escape") { event.preventDefault(); closeAndFocus(); }
    // Let the browser move to the next/previous control after the trigger.
    else if (event.key === "Tab") closeAndFocus();
    else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault(); item.current?.focus();
    } else if (event.key === " ") { event.preventDefault(); item.current?.click(); }
  };
  return <div ref={container} className="relative shrink-0" onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} type="button" disabled={!enabled} data-profile-trigger
      aria-label={t(enabled ? "profile.open" : "nav.youUnavailable", language)}
      aria-haspopup={enabled ? "menu" : undefined} aria-expanded={enabled ? open : undefined}
      aria-controls={enabled && open ? menuId : undefined}
      onClick={() => setOpen(value => !value)}
      onKeyDown={event => {
        if (["ArrowDown", "ArrowUp"].includes(event.key)) {
          event.preventDefault(); setOpen(true); item.current?.focus();
        }
      }}
      className="h-11 w-11 rounded-full border border-shinka-line flex items-center justify-center text-shinka-plum disabled:text-shinka-taupe focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shinka-plum">
      <UserRound className="h-5 w-5" aria-hidden="true" />
    </button>
    {enabled && open && <div id={menuId} role="menu" aria-label={t("profile.open", language)} onKeyDown={menuKey}
      className="absolute right-0 top-full mt-2 z-50 w-52 max-w-[calc(100vw-40px)] rounded-shinka-md border border-shinka-line bg-shinka-white p-2 font-body text-shinka-plum shadow-shinka-card">
      <MenuLink itemRef={item} leaveLayer={leaveLayer} role="menuitem" tabIndex={-1} to={ADMIN_PANEL_PATH} state={{ language }}
        className="flex items-center min-h-11 rounded-shinka-sm px-4 text-shinka-small break-words focus-visible:outline-2 focus-visible:outline-shinka-plum focus:bg-shinka-cream focus:text-shinka-plum-deep">
        {t("admin.panel", language)}
      </MenuLink>
    </div>}
  </div>;
}

// Traverse the transient layer entry before pushing the destination, so opening
// a menu does not leave an extra root entry behind normal page navigation.
function MenuLink({ itemRef, leaveLayer, to, state, children, ...props }) {
  const navigate = useNavigate();
  return <Link ref={itemRef} to={to} state={state} {...props} onClick={event => { event.preventDefault(); leaveLayer(() => navigate(to, { state })); }}>{children}</Link>;
}

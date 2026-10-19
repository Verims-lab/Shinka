// Harmless foundation shell (Foundation scope). Contains NO business data and no daily content.
// Navigation follows the UI/UX v1.1 contract (uiContract): Home · Calendar · Pattern; You via top-right profile icon.
import { House, CalendarDays, Moon } from "lucide-react";
import { BOTTOM_NAV } from "@/foundation/uiContract";
import ProfileMenu from "@/components/profile/ProfileMenu";
import { t } from "@/foundation/i18n/strings";

const ICONS = { House, CalendarDays, Moon };

export default function Home({ profileAccess = undefined, language = undefined }) {
  const copy = key => t(key, language);
  return (
    <div className="shinka-viewport shinka-safe-shell bg-shinka-ivory text-shinka-ink font-body flex flex-col">
      <header className="flex items-center justify-between px-5 pt-6">
        <span className="font-heading font-medium text-shinka-h3 text-shinka-plum">Shinka</span>
        {profileAccess || <ProfileMenu language={language} />}
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-5 text-center">
        <p className="text-shinka-caption uppercase tracking-[0.3em] text-shinka-taupe mb-6">{copy("shell.eyebrow")}</p>
        <h1 className="font-heading font-medium text-shinka-h1 text-shinka-plum-deep max-w-md">{copy("shell.title")}</h1>
        <p className="mt-6 text-shinka-body text-shinka-taupe max-w-xs">{copy("shell.body")}</p>
      </main>
      <nav aria-label={copy("nav.inactive")} className="grid grid-cols-3 border-t border-shinka-line bg-shinka-white">
        {BOTTOM_NAV.map((item) => {
          const Icon = ICONS[item.component];
          return (
            <span key={item.key} aria-disabled="true" className="min-h-14 flex flex-col items-center justify-center gap-1 text-shinka-caption text-shinka-taupe">
              <Icon className="h-5 w-5" aria-hidden="true" />
              {copy(item.labelKey)}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
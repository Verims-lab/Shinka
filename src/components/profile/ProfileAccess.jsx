import { useAuth } from "@/lib/AuthContext";
import ProfileMenu from "./ProfileMenu";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { t } from "@/foundation/i18n/strings";
import { privacyCopy } from '@/foundation/i18n/privacyCopy';

export default function ProfileAccess({ language, productReady = false }) {
  const { isAdmin, isAuthenticated } = useAuth();
  if (productReady && isAuthenticated) return <Link to={`/you?lang=${language === 'tr' ? 'tr' : 'en'}`} aria-label={t('profile.open', language)} data-profile-trigger
    className="h-11 w-11 rounded-full border border-shinka-line flex items-center justify-center text-shinka-plum focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shinka-plum"><UserRound className="h-5 w-5" aria-hidden="true"/></Link>;
  return <div className="flex flex-wrap items-center gap-3"><ProfileMenu enabled={isAdmin} language={language} />{isAuthenticated && <Link to={`/account-privacy?lang=${language}`} className="inline-flex min-h-11 items-center text-shinka-plum text-shinka-caption">{privacyCopy('title', language)}</Link>}</div>;
}

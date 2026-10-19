import { Link, useLocation } from "react-router-dom";
import PageContainer from "@/components/shinka/PageContainer";
import PageHeader from "@/components/shinka/PageHeader";
import ShinkaCard from "@/components/shinka/ShinkaCard";
import InternalNav from "@/components/internal/InternalNav";
import { INTERNAL_TOOLS, internalLanguage } from "@/foundation/internalNavigation";
import { t } from "@/foundation/i18n/strings";

export default function AdminPanel() {
  const language = internalLanguage(useLocation().state);
  return <PageContainer>
    <InternalNav />
    <PageHeader eyebrow="Shinka" title={t("admin.panel", language)} />
    <main data-admin-panel className="grid gap-5 md:grid-cols-2">
      {INTERNAL_TOOLS.map(tool => <Link key={tool.path} to={tool.path} state={{ language }}
        className="block min-w-0 rounded-shinka-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shinka-plum">
        <ShinkaCard title={t(tool.titleKey, language)} className="h-full hover:border-shinka-plum">
          <p className="text-shinka-body text-shinka-taupe">{t(tool.descriptionKey, language)}</p>
        </ShinkaCard>
      </Link>)}
    </main>
  </PageContainer>;
}

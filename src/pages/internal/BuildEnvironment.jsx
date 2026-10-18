import PageContainer from "@/components/shinka/PageContainer";
import PageHeader from "@/components/shinka/PageHeader";
import ShinkaCard from "@/components/shinka/ShinkaCard";
import KeyValueGrid from "@/components/shinka/KeyValueGrid";
import InternalNav from "@/components/internal/InternalNav";
import LatestHealthCard from "@/components/internal/LatestHealthCard";
import LedgerList from "@/components/internal/LedgerList";
import CapabilityList from "@/components/internal/CapabilityList";
import { BUILD_MARKER } from "@/foundation/buildMarker";
import { currentLedgerEntry } from "@/foundation/buildLedger";
import { APP_NAME, resolveEnvironment } from "@/foundation/environment";
import { HEALTH_CATALOG_VERSION } from "@/foundation/health/constants";
import { SOURCE_SET_VERSION } from "@/foundation/sourceInventory";

export default function BuildEnvironment() {
  const entry = currentLedgerEntry();
  return (
    <PageContainer>
      <InternalNav />
      <PageHeader eyebrow="Internal · Build & Environment" title="Build & Environment" />
      <ShinkaCard title="Current build">
        <KeyValueGrid items={[["App", APP_NAME], ["BuildMarker", BUILD_MARKER], ["Package", entry.package_name],
          ["Environment", resolveEnvironment().id], ["Health catalog", HEALTH_CATALOG_VERSION], ["Source-document set", SOURCE_SET_VERSION]]} />
      </ShinkaCard>
      <LatestHealthCard />
      <LedgerList />
      <CapabilityList />
    </PageContainer>
  );
}
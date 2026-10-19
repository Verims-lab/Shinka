import { Component, Suspense } from "react";
import PageContainer from "@/components/shinka/PageContainer";
import StatePanel from "@/components/shinka/StatePanel";
import { onboardingCopy } from "@/foundation/i18n/onboardingCopy";
import { resolveLanguage } from "@/foundation/i18n/strings";

/** @extends {Component<{children:import('react').ReactNode},{failed:boolean}>} */
class ChunkBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <PageContainer>
          <StatePanel
            state="LOAD_FAILURE"
            message={onboardingCopy("systemError", resolveLanguage())}
            onRetry={() => window.location.reload()}
          />
        </PageContainer>
      );
    return this.props.children;
  }
}

export default function RouteBoundary({ children }) {
  return (
    <ChunkBoundary>
      <Suspense
        fallback={
          <PageContainer>
            <div role="status" aria-label="Shinka" aria-busy="true">
              …
            </div>
          </PageContainer>
        }
      >
        {children}
      </Suspense>
    </ChunkBoundary>
  );
}

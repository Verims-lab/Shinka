import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import PageContainer from "@/components/shinka/PageContainer";
import StatePanel from "@/components/shinka/StatePanel";

// INTERNAL TOOLING gate — platform-native role check (role === "admin"). No email-based authority.
export default function AdminGate() {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return (
      <PageContainer>
        <StatePanel state="DISABLED" message="This area is not available." code="FORBIDDEN" />
      </PageContainer>
    );
  }
  return <Outlet />;
}
import { useAuth } from "@/lib/AuthContext";
import ProfileMenu from "./ProfileMenu";

export default function ProfileAccess({ language }) {
  const { isAdmin } = useAuth();
  return <ProfileMenu enabled={isAdmin} language={language} />;
}

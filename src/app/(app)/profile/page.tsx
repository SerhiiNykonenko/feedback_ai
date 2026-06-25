import { getProfile } from "@/features/profile/data";
import { ProfileView } from "@/features/profile/profile-view";
import { requireUser } from "@/server/auth/guards";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return <ProfileView profile={profile} />;
}

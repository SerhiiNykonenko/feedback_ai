import { getSettingsData } from "@/features/settings/data";
import { SettingsView } from "@/features/settings/settings-view";
import { requireAnyPermission } from "@/server/auth/guards";

export default async function SettingsPage() {
  const user = await requireAnyPermission([
    "settings.manage.users",
    "settings.manage.products",
    "settings.manage.permissions"
  ]);
  const data = await getSettingsData();
  return <SettingsView data={data} permissions={user.permissions} />;
}

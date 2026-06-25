import { DashboardView } from "@/features/dashboard/dashboard-view";
import { getDashboardData } from "@/features/dashboard/data";
import { requirePermission } from "@/server/auth/guards";

export default async function DashboardPage() {
  const user = await requirePermission("dashboard.read");
  const data = await getDashboardData(user.id, user.teamId);
  return <DashboardView data={data} />;
}

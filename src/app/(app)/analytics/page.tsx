import { AnalyticsView } from "@/features/analytics/analytics-view";
import { getAnalytics } from "@/features/analytics/data";
import { requirePermission } from "@/server/auth/guards";

export default async function AnalyticsPage() {
  const user = await requirePermission("analytics.read.employee");
  const data = await getAnalytics(user.id, user.teamId);
  return <AnalyticsView data={data} />;
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

type DashboardData = Awaited<ReturnType<typeof import("./data").getDashboardData>>;

export function DashboardView({ data }: { data: DashboardData }) {
  const { t } = useI18n();
  const cards = [
    { title: t("pendingReviews"), value: data.pendingReviews, description: t("reviewsSubtitle") },
    {
      title: t("requestedFeedback"),
      value: data.requestedFeedback,
      description: t("requestFeedback")
    },
    { title: t("completedReviews"), value: data.completedReviews, description: t("feedbackTasks") },
    {
      title: t("teamCompletion"),
      value: formatPercent(data.completionRate),
      description: t("analyticsSubtitle")
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboardSubtitle")}</p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard metrics">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>{t("recentActivity")}</CardTitle>
          <CardDescription>Latest notifications and workflow updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recentActivity.length ? (
            data.recentActivity.map((item) => (
              <div key={item.id} className="flex items-start justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
                <Badge>{item.status.toLowerCase()}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

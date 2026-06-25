"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

type AnalyticsData = Awaited<ReturnType<typeof import("./data").getAnalytics>>;

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("analytics")}</h1>
        <p className="text-sm text-muted-foreground">{t("analyticsSubtitle")}</p>
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Employee average score</CardDescription>
            <CardTitle className="text-3xl">{data.averageScore.toFixed(1)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Calculated from numeric ratings in received feedback.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Team completion rate</CardDescription>
            <CardTitle className="text-3xl">{formatPercent(data.completionRate)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Approved and published reviews in the scoped team.
            </p>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Strengths</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.strengths.map((item) => (
              <Badge key={item}>{item}</Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Areas for improvement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.improvements.map((item) => (
              <Badge key={item}>{item}</Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Participation</CardTitle>
            <CardDescription>Recent cycle volume by scope.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.cycleParticipation.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <Badge>{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

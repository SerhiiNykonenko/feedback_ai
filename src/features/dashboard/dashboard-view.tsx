"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2, ClipboardList, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

type DashboardData = Awaited<ReturnType<typeof import("./data").getDashboardData>>;
type NextAction = {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  href: string;
};

function isNextAction(action: NextAction | null): action is NextAction {
  return action !== null;
}

export function DashboardView({
  data,
  permissions
}: {
  data: DashboardData;
  permissions: string[];
}) {
  const { t } = useI18n();
  const canReview = permissions.includes("feedback.review.team");
  const canPublish = permissions.includes("feedback.publish");
  const nextActions = [
    {
      title: "Write feedback",
      value: data.draftsToWrite,
      description: "Drafts assigned to you.",
      icon: ClipboardList,
      href: "/reviews"
    },
    canReview
      ? {
          title: "Review team feedback",
          value: data.waitingForReview,
          description: "Submitted feedback waiting for manager review.",
          icon: CheckCircle2,
          href: "/reviews"
        }
      : null,
    canPublish
      ? {
          title: "Publish approved feedback",
          value: data.readyToPublish,
          description: "Approved feedback ready to share.",
          icon: Send,
          href: "/reviews"
        }
      : null
  ].filter(isNextAction);

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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("dashboard")}</h1>
          <p className="text-sm text-muted-foreground">
            Start with the items that need your attention today.
          </p>
        </div>
        <Button asChild>
          <Link href="/reviews">
            Open review workspace
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Next actions">
        {nextActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.title}
              className={action.value > 0 ? "border-primary/25 bg-primary/5" : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardDescription>{action.title}</CardDescription>
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <CardTitle className="text-3xl">{action.value}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{action.description}</p>
                <Button asChild size="sm" variant={action.value > 0 ? "default" : "outline"}>
                  <Link href={action.href}>{action.value > 0 ? "Continue" : "View"}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

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

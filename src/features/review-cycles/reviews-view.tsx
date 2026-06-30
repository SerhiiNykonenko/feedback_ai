"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardCheck, Send, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-view";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import { canViewFeedbackDetails } from "@/domain/feedback-access";
import { cn } from "@/lib/utils";
import { getFeedbackPrimaryAction, getFeedbackStatusMeta } from "@/domain/feedback-status";
import { createReviewCycle, transitionReviewCycle } from "./actions";
import { requestFeedback, transitionFeedback } from "@/features/feedback/actions";

type ReviewsData = Awaited<ReturnType<typeof import("./data").getReviewsData>>;
type FeedbackTask = ReviewsData["feedback"][number];

const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

function FeedbackStatusBadge({ status }: { status: string }) {
  const meta = getFeedbackStatusMeta(status);
  return <Badge className={cn("border", meta.tone)}>{meta.label}</Badge>;
}

function FeedbackTaskCard({
  feedback,
  currentUserId,
  currentTeamId,
  permissions,
  run
}: {
  feedback: FeedbackTask;
  currentUserId: string;
  currentTeamId: string | null | undefined;
  permissions: string[];
  run: (action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const { t } = useI18n();
  const isAuthorDraft = feedback.authorId === currentUserId && feedback.status === "DRAFT";
  const canReview =
    feedback.status === "SUBMITTED" && permissions.includes("feedback.review.team");
  const canApprove =
    feedback.status === "UNDER_REVIEW" && permissions.includes("feedback.approve");
  const canPublish = feedback.status === "APPROVED" && permissions.includes("feedback.publish");
  const canOpen = canViewFeedbackDetails(
    {
      status: feedback.status,
      authorId: feedback.authorId,
      requesterId: feedback.requesterId,
      subjectId: feedback.subjectId,
      subjectTeamId: feedback.subject.teamId
    },
    { userId: currentUserId, teamId: currentTeamId, permissions }
  );
  const statusMeta = getFeedbackStatusMeta(feedback.status);

  return (
    <Card data-testid="feedback-task">
      <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{feedback.cycle.name}</p>
            <FeedbackStatusBadge status={feedback.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {feedback.author.name} -&gt; {feedback.subject.name}
          </p>
          <p className="text-xs text-muted-foreground">{statusMeta.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canOpen ? (
            <Button asChild size="sm" variant={isAuthorDraft ? "default" : "outline"}>
              <Link data-testid={`open-feedback-${feedback.id}`} href={`/reviews/${feedback.id}`}>
                {isAuthorDraft ? getFeedbackPrimaryAction(feedback.status) : "View"}
              </Link>
            </Button>
          ) : null}
          {canReview ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                run(() =>
                  transitionFeedback({
                    feedbackId: feedback.id,
                    targetStatus: "UNDER_REVIEW"
                  })
                )
              }
            >
              {getFeedbackPrimaryAction(feedback.status)}
            </Button>
          ) : null}
          {canApprove ? (
            <Button
              size="sm"
              onClick={() =>
                run(() =>
                  transitionFeedback({
                    feedbackId: feedback.id,
                    targetStatus: "APPROVED"
                  })
                )
              }
            >
              {t("approve")}
            </Button>
          ) : null}
          {canPublish ? (
            <Button
              size="sm"
              onClick={() =>
                run(() =>
                  transitionFeedback({
                    feedbackId: feedback.id,
                    targetStatus: "PUBLISHED"
                  })
                )
              }
            >
              {t("publish")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReviewsView({
  data,
  permissions,
  currentUserId,
  currentTeamId
}: {
  data: ReviewsData;
  permissions: string[];
  currentUserId: string;
  currentTeamId: string | null | undefined;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const canManageCycles =
    permissions.includes("cycles.manage.team") || permissions.includes("cycles.manage.org");
  const canModerateFeedback =
    permissions.includes("feedback.review.team") ||
    permissions.includes("feedback.approve") ||
    permissions.includes("feedback.publish");
  const activeCycles = data.cycles.filter((cycle) => cycle.status === "ACTIVE");

  const grouped = useMemo(() => {
    const myTasks = data.feedback.filter(
      (feedback) => feedback.authorId === currentUserId && feedback.status === "DRAFT"
    );
    const requestedByMe = data.feedback.filter(
      (feedback) => feedback.requesterId === currentUserId && feedback.authorId !== currentUserId
    );
    const teamReview = canModerateFeedback
      ? data.feedback.filter((feedback) =>
          ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(feedback.status) &&
          feedback.requesterId !== currentUserId
        )
      : [];
    const allOther = data.feedback.filter(
      (feedback) =>
        !myTasks.some((task) => task.id === feedback.id) &&
        !requestedByMe.some((task) => task.id === feedback.id) &&
        !teamReview.some((task) => task.id === feedback.id)
    );
    return { myTasks, requestedByMe, teamReview, allOther };
  }, [canModerateFeedback, currentUserId, data.feedback]);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? t("success") : (result.error ?? t("failed")));
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("reviews")}</h1>
          <p className="text-sm text-muted-foreground">
            Focus on the feedback that needs your attention first.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="#request-feedback">
            <Send className="mr-2 h-4 w-4" aria-hidden />
            {t("requestFeedback")}
          </a>
        </Button>
      </div>
      {message ? <p className="rounded-md border bg-muted px-3 py-2 text-sm">{message}</p> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardDescription>Your next action</CardDescription>
            <CardTitle>{grouped.myTasks.length} to write</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Drafts assigned to you are shown first, with autosave enabled in the form.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Requested by you</CardDescription>
            <CardTitle>{grouped.requestedByMe.length} in progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track feedback you asked teammates to provide.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Review queue</CardDescription>
            <CardTitle>{grouped.teamReview.length} waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manager, HR, and Admin actions appear only when your role allows them.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">My feedback to write</h2>
        </div>
        {grouped.myTasks.length ? (
          <div className="space-y-3">
            {grouped.myTasks.map((feedback) => (
              <FeedbackTaskCard
                key={feedback.id}
                feedback={feedback}
                currentUserId={currentUserId}
                currentTeamId={currentTeamId}
                permissions={permissions}
                run={run}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="You're all caught up"
            description="No feedback drafts need your response right now."
          />
        )}
      </section>

      <section id="request-feedback">
        <Card>
          <CardHeader>
            <CardTitle>{t("requestFeedback")}</CardTitle>
            <CardDescription>
              Choose who the feedback is about and who should write it. If there is one active
              cycle, we select it automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              data-testid="request-feedback-form"
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                run(() =>
                  requestFeedback({
                    cycleId: String(form.get("cycleId")),
                    subjectId: String(form.get("subjectId")),
                    authorId: String(form.get("authorId"))
                  })
                );
                event.currentTarget.reset();
              }}
            >
              <select
                name="cycleId"
                className={selectClass}
                required
                defaultValue={activeCycles.length === 1 ? activeCycles[0].id : ""}
              >
                <option value="" disabled>
                  {t("cycleName")}
                </option>
                {activeCycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
              <select name="subjectId" className={selectClass} required defaultValue={currentUserId}>
                {data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {t("subject")}: {user.name}
                  </option>
                ))}
              </select>
              <select name="authorId" className={selectClass} required defaultValue="">
                <option value="" disabled>
                  Written by
                </option>
                {data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={pending || activeCycles.length === 0}>
                {pending ? t("loading") : t("requestFeedback")}
              </Button>
              {activeCycles.length === 1 ? (
                <p className="md:col-span-2 text-xs text-muted-foreground">
                  Cycle selected: {activeCycles[0].name}
                </p>
              ) : null}
              {activeCycles.length === 0 ? (
                <p className="md:col-span-2 text-xs text-destructive">
                  No active review cycle is available for new requests.
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requested by me</CardTitle>
            <CardDescription>Everything you asked other people to write.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {grouped.requestedByMe.length ? (
              grouped.requestedByMe.map((feedback) => (
                <FeedbackTaskCard
                  key={feedback.id}
                  feedback={feedback}
                  currentUserId={currentUserId}
                  currentTeamId={currentTeamId}
                  permissions={permissions}
                  run={run}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No outgoing requests yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team review queue</CardTitle>
            <CardDescription>Items waiting for review, approval, or publishing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {grouped.teamReview.length ? (
              grouped.teamReview.map((feedback) => (
                <FeedbackTaskCard
                  key={feedback.id}
                  feedback={feedback}
                  currentUserId={currentUserId}
                  currentTeamId={currentTeamId}
                  permissions={permissions}
                  run={run}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nothing is waiting for review.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {grouped.allOther.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Other feedback</h2>
          {grouped.allOther.map((feedback) => (
            <FeedbackTaskCard
              key={feedback.id}
              feedback={feedback}
              currentUserId={currentUserId}
              currentTeamId={currentTeamId}
              permissions={permissions}
              run={run}
            />
          ))}
        </section>
      ) : null}

      {canManageCycles ? (
        <section className="space-y-4">
          <details className="rounded-xl border bg-card p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-semibold">
                <Settings2 className="h-5 w-5 text-muted-foreground" aria-hidden />
                Cycle administration
              </span>
              <span className="text-sm text-muted-foreground">
                Create, start, close, and archive cycles
              </span>
            </summary>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("createCycle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-3 sm:grid-cols-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      const startsAt = String(form.get("startsAt") || "");
                      const endsAt = String(form.get("endsAt") || "");
                      run(() =>
                        createReviewCycle({
                          name: String(form.get("name")),
                          description: String(form.get("description") || ""),
                          type: String(form.get("type")) as "PERFORMANCE",
                          templateId: String(form.get("templateId")),
                          productId: String(form.get("productId") || ""),
                          teamId: String(form.get("teamId") || ""),
                          startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
                          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined
                        })
                      );
                      event.currentTarget.reset();
                    }}
                  >
                    <Input name="name" placeholder={t("cycleName")} required />
                    <select name="type" className={selectClass} defaultValue="PERFORMANCE">
                      {[
                        "PERFORMANCE",
                        "PEER",
                        "FEEDBACK_360",
                        "MANAGER",
                        "SELF",
                        "PROBATION",
                        "PROMOTION",
                        "CONTINUOUS"
                      ].map((type) => (
                        <option key={type} value={type}>
                          {type.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <select name="templateId" className={selectClass} required defaultValue="">
                      <option value="" disabled>
                        {t("template")}
                      </option>
                      {data.templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <select name="teamId" className={selectClass} defaultValue="">
                      <option value="">{t("team")}</option>
                      {data.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <select name="productId" className={selectClass} defaultValue="">
                      <option value="">{t("product")}</option>
                      {data.products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="cycle-starts-at">
                        {t("cycleStarts")}
                      </label>
                      <Input id="cycle-starts-at" name="startsAt" type="datetime-local" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="cycle-ends-at">
                        {t("cycleEnds")}
                      </label>
                      <Input id="cycle-ends-at" name="endsAt" type="datetime-local" />
                    </div>
                    <Textarea name="description" placeholder={t("description")} />
                    <Button type="submit" disabled={pending}>
                      {pending ? t("loading") : t("createCycle")}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {data.cycles.length ? (
                  data.cycles.map((cycle) => (
                    <Card key={cycle.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle>{cycle.name}</CardTitle>
                            <CardDescription>{cycle.template.name}</CardDescription>
                          </div>
                          <Badge>{cycle.status.toLowerCase()}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>{cycle.description ?? ""}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{cycle.type.toLowerCase().replaceAll("_", " ")}</Badge>
                          <Badge>{cycle._count.feedback} feedback</Badge>
                        </div>
                        <div className="flex gap-2">
                          {cycle.status === "DRAFT" ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                run(() =>
                                  transitionReviewCycle({ id: cycle.id, targetStatus: "ACTIVE" })
                                )
                              }
                            >
                              {t("start")}
                            </Button>
                          ) : null}
                          {cycle.status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                run(() =>
                                  transitionReviewCycle({ id: cycle.id, targetStatus: "CLOSED" })
                                )
                              }
                            >
                              {t("close")}
                            </Button>
                          ) : null}
                          {cycle.status === "CLOSED" ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                run(() =>
                                  transitionReviewCycle({ id: cycle.id, targetStatus: "ARCHIVED" })
                                )
                              }
                            >
                              {t("archive")}
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <EmptyState title="No review cycles" description={t("createCycle")} />
                )}
              </div>
            </div>
          </details>
        </section>
      ) : null}

      <div className="flex justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            Back to dashboard
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}

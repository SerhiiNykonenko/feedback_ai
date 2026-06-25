"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-view";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import { createReviewCycle, transitionReviewCycle } from "./actions";
import { requestFeedback, transitionFeedback } from "@/features/feedback/actions";

type ReviewsData = Awaited<ReturnType<typeof import("./data").getReviewsData>>;

const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

export function ReviewsView({
  data,
  permissions,
  currentUserId
}: {
  data: ReviewsData;
  permissions: string[];
  currentUserId: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const canManageCycles =
    permissions.includes("cycles.manage.team") || permissions.includes("cycles.manage.org");

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
      <div>
        <h1 className="text-2xl font-semibold">{t("reviews")}</h1>
        <p className="text-sm text-muted-foreground">{t("reviewsSubtitle")}</p>
      </div>
      {message ? <p className="rounded-md border bg-muted px-3 py-2 text-sm">{message}</p> : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {canManageCycles ? (
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
                <Input name="startsAt" type="datetime-local" />
                <Input name="endsAt" type="datetime-local" />
                <Textarea name="description" placeholder={t("description")} />
                <Button type="submit" disabled={pending}>
                  {pending ? t("loading") : t("createCycle")}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>{t("requestFeedback")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              data-testid="request-feedback-form"
              className="space-y-3"
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
              <select name="cycleId" className={selectClass} required defaultValue="">
                <option value="" disabled>
                  {t("cycleName")}
                </option>
                {data.cycles
                  .filter((cycle) => cycle.status === "ACTIVE")
                  .map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </option>
                  ))}
              </select>
              <select
                name="subjectId"
                className={selectClass}
                required
                defaultValue={currentUserId}
              >
                {data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {t("subject")}: {user.name}
                  </option>
                ))}
              </select>
              <select name="authorId" className={selectClass} required defaultValue="">
                <option value="" disabled>
                  {t("author")}
                </option>
                {data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={pending}>
                {pending ? t("loading") : t("requestFeedback")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("feedbackTasks")}</h2>
        {data.feedback.length ? (
          <div className="space-y-3">
            {data.feedback.map((feedback) => (
              <Card key={feedback.id} data-testid="feedback-task">
                <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium">{feedback.cycle.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {feedback.author.name} → {feedback.subject.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{feedback.status.toLowerCase().replaceAll("_", " ")}</Badge>
                    {feedback.authorId === currentUserId && feedback.status === "DRAFT" ? (
                      <Button asChild size="sm">
                        <Link
                          data-testid={`open-feedback-${feedback.id}`}
                          href={`/reviews/${feedback.id}`}
                        >
                          {t("openForm")}
                        </Link>
                      </Button>
                    ) : null}
                    {feedback.status === "SUBMITTED" &&
                    permissions.includes("feedback.review.team") ? (
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
                        Review
                      </Button>
                    ) : null}
                    {feedback.status === "UNDER_REVIEW" &&
                    permissions.includes("feedback.approve") ? (
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
                    {feedback.status === "APPROVED" && permissions.includes("feedback.publish") ? (
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
            ))}
          </div>
        ) : (
          <EmptyState title={t("noFeedbackTasks")} description={t("requestFeedback")} />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("cycles")}</h2>
        {data.cycles.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.cycles.map((cycle) => (
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
                  {canManageCycles ? (
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
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No review cycles" description={t("createCycle")} />
        )}
      </section>
    </div>
  );
}

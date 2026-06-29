import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { isDatabaseUnavailable } from "@/server/database-errors";
import { demoNotifications } from "@/server/demo-data";

export async function getDashboardData(
  userId: string,
  teamId?: string | null,
  permissions: string[] = []
) {
  try {
    const canReviewTeam = permissions.includes("feedback.review.team");
    const canSeeOrg = permissions.includes("cycles.manage.org");
    const canPublish = permissions.includes("feedback.publish");
    const teamScope: Prisma.FeedbackWhereInput = canSeeOrg
      ? {}
      : teamId
        ? { subject: { teamId } }
        : { subjectId: userId };
    const [
      pendingReviews,
      requestedFeedback,
      completedReviews,
      recentActivity,
      teamFeedback,
      draftsToWrite,
      waitingForReview,
      readyToPublish
    ] = await Promise.all([
        prisma.feedback.count({
          where: { authorId: userId, status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW"] } }
        }),
        prisma.feedback.count({ where: { requesterId: userId } }),
        prisma.feedback.count({
          where: { authorId: userId, status: { in: ["APPROVED", "PUBLISHED"] } }
        }),
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 6
        }),
        prisma.feedback.findMany({
          where: teamId ? { subject: { teamId } } : { subjectId: userId },
          select: { progress: true, status: true, updatedAt: true },
          take: 100,
          orderBy: { updatedAt: "desc" }
        }),
        prisma.feedback.count({ where: { authorId: userId, status: "DRAFT" } }),
        canReviewTeam
          ? prisma.feedback.count({ where: { ...teamScope, status: "SUBMITTED" } })
          : Promise.resolve(0),
        canPublish
          ? prisma.feedback.count({ where: { ...teamScope, status: "APPROVED" } })
          : Promise.resolve(0)
      ]);

    const completionRate = teamFeedback.length
      ? teamFeedback.filter((item) => ["APPROVED", "PUBLISHED"].includes(item.status)).length /
        teamFeedback.length
      : 0;

    return {
      pendingReviews,
      requestedFeedback,
      completedReviews,
      completionRate,
      draftsToWrite,
      waitingForReview,
      readyToPublish,
      recentActivity
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    return {
      pendingReviews: 3,
      requestedFeedback: 5,
      completedReviews: 11,
      completionRate: 0.78,
      draftsToWrite: 2,
      waitingForReview: 1,
      readyToPublish: 0,
      recentActivity: demoNotifications
    };
  }
}

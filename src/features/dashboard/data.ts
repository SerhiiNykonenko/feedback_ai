import "server-only";
import { prisma } from "@/server/db";
import { isDatabaseUnavailable } from "@/server/database-errors";
import { demoNotifications } from "@/server/demo-data";

export async function getDashboardData(userId: string, teamId?: string | null) {
  try {
    const [pendingReviews, requestedFeedback, completedReviews, recentActivity, teamFeedback] =
      await Promise.all([
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
        })
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
      recentActivity
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    return {
      pendingReviews: 3,
      requestedFeedback: 5,
      completedReviews: 11,
      completionRate: 0.78,
      recentActivity: demoNotifications
    };
  }
}

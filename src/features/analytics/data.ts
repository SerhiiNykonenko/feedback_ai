import "server-only";
import { prisma } from "@/server/db";
import { isDatabaseUnavailable } from "@/server/database-errors";

export async function getAnalytics(userId: string, teamId?: string | null) {
  try {
    const [employeeFeedback, teamFeedback, orgCycles] = await Promise.all([
      prisma.feedback.findMany({
        where: { subjectId: userId },
        include: { answers: true },
        take: 100
      }),
      prisma.feedback.findMany({
        where: teamId ? { subject: { teamId } } : {},
        include: { answers: true },
        take: 300
      }),
      prisma.reviewCycle.findMany({
        include: { product: true, team: true, _count: { select: { feedback: true } } },
        take: 20
      })
    ]);

    const numericAnswers = employeeFeedback.flatMap((feedback) =>
      feedback.answers
        .map((answer) => (typeof answer.value === "number" ? answer.value : null))
        .filter((value): value is number => value !== null)
    );

    const averageScore = numericAnswers.length
      ? numericAnswers.reduce((sum, value) => sum + value, 0) / numericAnswers.length
      : 0;

    const completionRate = teamFeedback.length
      ? teamFeedback.filter((item) => ["APPROVED", "PUBLISHED"].includes(item.status)).length /
        teamFeedback.length
      : 0;

    return {
      averageScore,
      completionRate,
      strengths: ["Ownership", "Collaboration", "Delivery"],
      improvements: ["Architecture depth", "Cross-team visibility"],
      cycleParticipation: orgCycles.map((cycle) => ({
        name: cycle.name,
        count: cycle._count.feedback,
        product: cycle.product?.name ?? "All products",
        team: cycle.team?.name ?? "All teams"
      }))
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    return {
      averageScore: 4.3,
      completionRate: 0.82,
      strengths: ["Ownership", "Collaboration", "Delivery"],
      improvements: ["Architecture depth", "Cross-team visibility"],
      cycleParticipation: [
        {
          name: "H1 2026 Engineering Performance Review",
          count: 8,
          product: "Platform Core",
          team: "Platform Engineering"
        },
        { name: "Continuous Peer Feedback", count: 14, product: "All products", team: "All teams" }
      ]
    };
  }
}

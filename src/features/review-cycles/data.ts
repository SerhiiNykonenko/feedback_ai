import "server-only";
import { prisma } from "@/server/db";
import { isDatabaseUnavailable } from "@/server/database-errors";
import { demoCycles, demoTemplates, demoUsers } from "@/server/demo-data";

export async function getReviewsData(
  userId: string,
  teamId: string | null | undefined,
  permissions: string[]
) {
  try {
    const canSeeTeam = permissions.includes("feedback.review.team");
    const canSeeOrg = permissions.includes("cycles.manage.org");
    const [cycles, templates, products, teams, users, feedback] = await Promise.all([
      prisma.reviewCycle.findMany({
        include: {
          template: true,
          product: true,
          team: true,
          _count: { select: { feedback: true } }
        },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
      }),
      prisma.feedbackTemplate.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.product.findMany({ orderBy: { name: "asc" } }),
      prisma.team.findMany({ orderBy: { name: "asc" } }),
      prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, email: true, teamId: true },
        orderBy: { name: "asc" }
      }),
      prisma.feedback.findMany({
        where: canSeeOrg
          ? {}
          : canSeeTeam && teamId
            ? {
                OR: [
                  { authorId: userId },
                  { requesterId: userId },
                  { subjectId: userId },
                  { subject: { teamId } }
                ]
              }
            : { OR: [{ authorId: userId }, { requesterId: userId }, { subjectId: userId }] },
        include: { cycle: true, author: true, subject: true, requester: true },
        orderBy: { updatedAt: "desc" },
        take: 100
      })
    ]);
    return { cycles, templates, products, teams, users, feedback };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    return {
      cycles: demoCycles,
      templates: demoTemplates,
      products: [{ id: "demo-product-platform", name: "Platform Core" }],
      teams: [{ id: "demo-platform-team", name: "Platform Engineering" }],
      users: demoUsers,
      feedback: []
    };
  }
}

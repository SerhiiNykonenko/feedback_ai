import "server-only";
import { prisma } from "@/server/db";
import { isDatabaseUnavailable } from "@/server/database-errors";
import { demoTemplates } from "@/server/demo-data";

export async function getTemplates() {
  try {
    return await prisma.feedbackTemplate.findMany({
      include: {
        sections: { include: { questions: true }, orderBy: { order: "asc" } },
        _count: { select: { cycles: true } }
      },
      orderBy: [{ builtIn: "desc" }, { name: "asc" }]
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    return demoTemplates;
  }
}

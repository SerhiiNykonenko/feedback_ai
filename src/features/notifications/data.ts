import "server-only";
import { prisma } from "@/server/db";
import { demoNotifications } from "@/server/demo-data";
import { isDatabaseUnavailable } from "@/server/database-errors";

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50
  });
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    return await prisma.notification.count({
      where: { userId, status: "UNREAD" }
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    return demoNotifications.filter((notification) => notification.status === "UNREAD").length;
  }
}

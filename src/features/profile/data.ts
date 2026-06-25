import "server-only";
import { prisma } from "@/server/db";
import { demoNotifications, demoUsers } from "@/server/demo-data";
import { isDatabaseUnavailable } from "@/server/database-errors";

export async function getProfile(userId: string) {
  try {
    return await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        team: true,
        manager: true,
        roles: { include: { role: true } },
        notifications: { orderBy: { createdAt: "desc" }, take: 8 }
      }
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    const user = demoUsers.find((item) => item.id === userId) ?? demoUsers[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      title: user.title,
      team: { id: user.teamId, name: user.teamName },
      manager: user.managerName ? { id: "demo-manager", name: user.managerName } : null,
      roles: user.roles.map((role) => ({
        roleId: role,
        role: { id: role, name: role.toUpperCase(), key: role }
      })),
      notifications: demoNotifications
    };
  }
}

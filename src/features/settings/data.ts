import "server-only";
import { prisma } from "@/server/db";
import { demoUsers } from "@/server/demo-data";
import { isDatabaseUnavailable } from "@/server/database-errors";

export async function getSettingsData() {
  try {
    const [users, teams, products, roles, auditLogs] = await Promise.all([
      prisma.user.findMany({
        include: { team: true, roles: { include: { role: true } } },
        orderBy: { name: "asc" },
        take: 100
      }),
      prisma.team.findMany({
        include: { product: true, _count: { select: { users: true } } },
        orderBy: { name: "asc" }
      }),
      prisma.product.findMany({
        include: { _count: { select: { teams: true, cycles: true } } },
        orderBy: { name: "asc" }
      }),
      prisma.role.findMany({
        include: { _count: { select: { users: true, permissions: true } } },
        orderBy: { name: "asc" }
      }),
      prisma.auditLog.findMany({
        include: { actor: true },
        orderBy: { createdAt: "desc" },
        take: 20
      })
    ]);
    return { users, teams, products, roles, auditLogs };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    return {
      users: demoUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        title: user.title,
        team: { id: user.teamId, name: user.teamName },
        roles: user.roles.map((role) => ({
          roleId: role,
          role: { id: role, name: role.toUpperCase(), key: role }
        }))
      })),
      teams: [
        {
          id: "demo-platform-team",
          name: "Platform Engineering",
          product: { id: "demo-product-platform", name: "Platform Core" },
          _count: { users: 2 }
        },
        {
          id: "demo-quality-team",
          name: "Quality Guild",
          product: { id: "demo-product-portal", name: "Customer Portal" },
          _count: { users: 1 }
        }
      ],
      products: [
        { id: "demo-product-platform", name: "Platform Core", _count: { teams: 1, cycles: 1 } },
        { id: "demo-product-portal", name: "Customer Portal", _count: { teams: 1, cycles: 0 } }
      ],
      roles: [
        { id: "employee", name: "Employee", key: "employee", _count: { users: 2, permissions: 8 } },
        { id: "manager", name: "Manager", key: "manager", _count: { users: 1, permissions: 12 } },
        { id: "hr", name: "HR", key: "hr", _count: { users: 1, permissions: 14 } },
        { id: "admin", name: "Admin", key: "admin", _count: { users: 1, permissions: 20 } }
      ],
      auditLogs: [
        {
          id: "demo-audit-login",
          summary: "Demo mode enabled because PostgreSQL is unavailable",
          action: "LOGIN",
          actor: null,
          createdAt: new Date()
        }
      ]
    };
  }
}

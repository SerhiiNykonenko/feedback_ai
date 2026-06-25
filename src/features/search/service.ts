import "server-only";
import { prisma } from "@/server/db";
import { demoCycles, demoUsers } from "@/server/demo-data";
import { isDatabaseUnavailable } from "@/server/database-errors";

export async function globalSearch(query: string, permissions: string[], teamId?: string | null) {
  const q = query.trim();
  if (q.length < 2 || !permissions.includes("search.global")) return [];

  try {
    const [users, products, teams, cycles] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } }
          ],
          ...(permissions.includes("settings.manage.users")
            ? {}
            : teamId
              ? { teamId }
              : { id: "__none__" })
        },
        select: { id: true, name: true, email: true },
        take: 5
      }),
      permissions.includes("settings.manage.products")
        ? prisma.product.findMany({
            where: { name: { contains: q, mode: "insensitive" } },
            select: { id: true, name: true },
            take: 5
          })
        : Promise.resolve([]),
      prisma.team.findMany({
        where: {
          name: { contains: q, mode: "insensitive" },
          ...(permissions.includes("settings.manage.users") || !teamId ? {} : { id: teamId })
        },
        select: { id: true, name: true },
        take: 5
      }),
      prisma.reviewCycle.findMany({
        where: {
          name: { contains: q, mode: "insensitive" },
          ...(permissions.includes("cycles.manage.org") || !teamId ? {} : { teamId })
        },
        select: { id: true, name: true },
        take: 5
      })
    ]);

    return [
      ...users.map((user) => ({
        id: user.id,
        type: "user",
        label: `${user.name} (${user.email})`,
        href: "/settings"
      })),
      ...products.map((product) => ({
        id: product.id,
        type: "product",
        label: product.name,
        href: "/settings"
      })),
      ...teams.map((team) => ({ id: team.id, type: "team", label: team.name, href: "/settings" })),
      ...cycles.map((cycle) => ({
        id: cycle.id,
        type: "cycle",
        label: cycle.name,
        href: "/reviews"
      }))
    ];
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    const lower = q.toLowerCase();
    const users = demoUsers
      .filter(
        (user) =>
          user.name.toLowerCase().includes(lower) || user.email.toLowerCase().includes(lower)
      )
      .map((user) => ({
        id: user.id,
        type: "user",
        label: `${user.name} (${user.email})`,
        href: "/settings"
      }));
    const cycles = demoCycles
      .filter((cycle) => cycle.name.toLowerCase().includes(lower))
      .map((cycle) => ({ id: cycle.id, type: "cycle", label: cycle.name, href: "/reviews" }));
    return [...users, ...cycles].slice(0, 8);
  }
}

"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createServerAction } from "@/server/actions/create-server-action";
import { prisma } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import {
  createProductSchema,
  createTeamSchema,
  createUserSchema,
  updateUserRoleSchema
} from "./schemas";

const createProductAction = createServerAction({
  permission: "settings.manage.products",
  schema: createProductSchema,
  async handler(input, context) {
    const product = await prisma.product.create({ data: input });
    await writeAuditLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "Product",
      entityId: product.id,
      summary: `Created product ${product.name}`
    });
    revalidatePath("/settings");
    return product;
  }
});

const createTeamAction = createServerAction({
  permission: "settings.manage.users",
  schema: createTeamSchema,
  async handler(input, context) {
    const team = await prisma.team.create({
      data: {
        name: input.name,
        description: input.description,
        productId: input.productId || undefined
      }
    });
    await writeAuditLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "Team",
      entityId: team.id,
      summary: `Created team ${team.name}`
    });
    revalidatePath("/settings");
    return team;
  }
});

const createUserAction = createServerAction({
  permission: "settings.manage.users",
  schema: createUserSchema,
  async handler(input, context) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const role = await prisma.role.findUniqueOrThrow({ where: { key: input.roleKey } });
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        title: input.title,
        passwordHash,
        teamId: input.teamId || undefined,
        roles: { create: { roleId: role.id } }
      }
    });
    await writeAuditLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      summary: `Created user ${user.email}`
    });
    revalidatePath("/settings");
    return user;
  }
});

const updateUserRoleAction = createServerAction({
  permission: "settings.manage.permissions",
  schema: updateUserRoleSchema,
  async handler(input, context) {
    const role = await prisma.role.findUniqueOrThrow({ where: { key: input.roleKey } });
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: input.userId } }),
      prisma.userRole.create({ data: { userId: input.userId, roleId: role.id } })
    ]);
    await writeAuditLog({
      actorId: context.userId,
      action: "PERMISSION_CHANGE",
      entityType: "User",
      entityId: input.userId,
      summary: `Changed user role to ${role.name}`
    });
    revalidatePath("/settings");
    return { userId: input.userId, roleKey: input.roleKey };
  }
});

export async function createProduct(input: Parameters<typeof createProductAction>[0]) {
  return createProductAction(input);
}

export async function createTeam(input: Parameters<typeof createTeamAction>[0]) {
  return createTeamAction(input);
}

export async function createUser(input: Parameters<typeof createUserAction>[0]) {
  return createUserAction(input);
}

export async function updateUserRole(input: Parameters<typeof updateUserRoleAction>[0]) {
  return updateUserRoleAction(input);
}

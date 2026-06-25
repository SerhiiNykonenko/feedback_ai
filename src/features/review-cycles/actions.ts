"use server";

import { CycleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createServerAction } from "@/server/actions/create-server-action";
import { prisma } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { defaultWorkflowConfig, canTransitionCycle } from "@/domain/workflows";
import { reviewCycleSchema, transitionCycleSchema } from "./schemas";

const createReviewCycleAction = createServerAction({
  permission: ["cycles.manage.org", "cycles.manage.team"],
  schema: reviewCycleSchema,
  async handler(input, context) {
    const canManageOrg = context.permissions.includes("cycles.manage.org");
    const scopedTeamId = canManageOrg
      ? input.teamId || context.teamId || undefined
      : context.teamId || undefined;
    if (!canManageOrg && input.teamId && input.teamId !== context.teamId) {
      throw new Error("Managers can only create cycles for their own team");
    }
    const cycle = await prisma.reviewCycle.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        templateId: input.templateId,
        productId: input.productId || undefined,
        teamId: scopedTeamId,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        workflowConfig: defaultWorkflowConfig,
        createdById: context.userId
      }
    });
    await writeAuditLog({
      actorId: context.userId,
      action: "CREATE",
      entityType: "ReviewCycle",
      entityId: cycle.id,
      summary: `Created review cycle ${cycle.name}`
    });
    revalidatePath("/reviews");
    return cycle;
  }
});

const transitionReviewCycleAction = createServerAction({
  permission: ["cycles.manage.org", "cycles.manage.team"],
  schema: transitionCycleSchema,
  async handler(input, context) {
    const existing = await prisma.reviewCycle.findUniqueOrThrow({ where: { id: input.id } });
    if (!context.permissions.includes("cycles.manage.org") && existing.teamId !== context.teamId) {
      throw new Error("Managers can only transition cycles for their own team");
    }
    if (!canTransitionCycle(existing.status, input.targetStatus as CycleStatus)) {
      throw new Error(`Cannot transition ${existing.status} to ${input.targetStatus}`);
    }
    const cycle = await prisma.reviewCycle.update({
      where: { id: input.id },
      data: { status: input.targetStatus }
    });
    await writeAuditLog({
      actorId: context.userId,
      action:
        input.targetStatus === "ACTIVE"
          ? "START"
          : input.targetStatus === "CLOSED"
            ? "CLOSE"
            : "ARCHIVE",
      entityType: "ReviewCycle",
      entityId: cycle.id,
      summary: `Transitioned cycle ${cycle.name} to ${cycle.status}`
    });
    revalidatePath("/reviews");
    return cycle;
  }
});

export async function createReviewCycle(input: Parameters<typeof createReviewCycleAction>[0]) {
  return createReviewCycleAction(input);
}

export async function transitionReviewCycle(
  input: Parameters<typeof transitionReviewCycleAction>[0]
) {
  return transitionReviewCycleAction(input);
}

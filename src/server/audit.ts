import "server-only";
import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "./db";

export async function writeAuditLog(input: {
  actorId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}, database: Pick<Prisma.TransactionClient, "auditLog"> = prisma) {
  await database.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      metadata: input.metadata
    }
  });
}

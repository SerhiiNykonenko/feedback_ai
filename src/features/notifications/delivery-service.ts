import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { sendEmail } from "@/server/email";
import { logger } from "@/server/logging/logger";
import {
  feedbackRequestedEmailPayloadSchema,
  renderFeedbackRequestedEmail
} from "./email-templates";

const MAX_ATTEMPTS = 5;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

type ClaimedDelivery = {
  id: string;
  userId: string;
  recipient: string;
  templateKey: string;
  subject: string;
  payload: Prisma.JsonValue;
  idempotencyKey: string;
  attempts: number;
};

async function claimDeliveries(batchSize: number) {
  const staleBefore = new Date(Date.now() - LOCK_TIMEOUT_MS);
  return prisma.$queryRaw<ClaimedDelivery[]>(Prisma.sql`
    UPDATE "NotificationDelivery"
    SET
      "status" = 'PROCESSING'::"DeliveryStatus",
      "lockedAt" = NOW(),
      "attempts" = "attempts" + 1,
      "updatedAt" = NOW()
    WHERE "id" IN (
      SELECT "id"
      FROM "NotificationDelivery"
      WHERE
        (
          "status" = 'PENDING'::"DeliveryStatus"
          OR (
            "status" = 'PROCESSING'::"DeliveryStatus"
            AND "lockedAt" < ${staleBefore}
          )
        )
        AND "availableAt" <= NOW()
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${batchSize}
    )
    RETURNING "id", "userId", "recipient", "templateKey", "subject", "payload", "idempotencyKey", "attempts"
  `);
}

function retryDelayMs(attempts: number) {
  return Math.min(60 * 60 * 1000, 30_000 * 2 ** Math.max(0, attempts - 1));
}

function safeErrorMessage(error: unknown) {
  return (error instanceof Error ? error.message : "Unknown delivery error").slice(0, 1000);
}

async function deliverEmail(delivery: ClaimedDelivery) {
  if (delivery.templateKey !== "feedback_requested") {
    throw new Error(`Unsupported email template: ${delivery.templateKey}`);
  }

  const payload = feedbackRequestedEmailPayloadSchema.parse(delivery.payload);
  const content = renderFeedbackRequestedEmail(payload);
  return sendEmail({
    to: delivery.recipient,
    subject: delivery.subject,
    text: content.text,
    html: content.html,
    idempotencyKey: delivery.idempotencyKey,
    metadata: { userId: delivery.userId }
  });
}

async function processDelivery(delivery: ClaimedDelivery) {
  try {
    const result = await deliverEmail(delivery);
    await prisma.notificationDelivery.updateMany({
      where: { id: delivery.id, status: "PROCESSING" },
      data: {
        status: "SENT",
        providerMessageId: result.id,
        sentAt: new Date(),
        lockedAt: null,
        lastError: null
      }
    });
    return "sent" as const;
  } catch (error) {
    const exhausted = delivery.attempts >= MAX_ATTEMPTS;
    const message = safeErrorMessage(error);
    await prisma.notificationDelivery.updateMany({
      where: { id: delivery.id, status: "PROCESSING" },
      data: {
        status: exhausted ? "FAILED" : "PENDING",
        availableAt: exhausted
          ? new Date()
          : new Date(Date.now() + retryDelayMs(delivery.attempts)),
        lockedAt: null,
        lastError: message
      }
    });
    logger.error("Email delivery failed", {
      deliveryId: delivery.id,
      attempts: delivery.attempts,
      exhausted,
      error: message
    });
    return exhausted ? ("failed" as const) : ("retrying" as const);
  }
}

export async function processNotificationDeliveries(batchSize = 20) {
  const normalizedBatchSize = Math.max(1, Math.min(batchSize, 100));
  const deliveries = await claimDeliveries(normalizedBatchSize);
  const results = await Promise.all(deliveries.map(processDelivery));

  return {
    claimed: deliveries.length,
    sent: results.filter((result) => result === "sent").length,
    retrying: results.filter((result) => result === "retrying").length,
    failed: results.filter((result) => result === "failed").length
  };
}

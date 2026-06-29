import "server-only";
import type { Prisma } from "@prisma/client";
import { env } from "@/env";

type NotificationTransaction = Prisma.TransactionClient;

export async function queueFeedbackRequestedNotification(
  transaction: NotificationTransaction,
  input: {
    feedbackId: string;
    authorId: string;
    authorEmail: string;
    authorName: string;
    requesterName: string;
    cycleName: string;
  }
) {
  const href = `/reviews/${input.feedbackId}`;
  const notification = await transaction.notification.create({
    data: {
      userId: input.authorId,
      type: "feedback_requested",
      title: "Feedback requested",
      body: `${input.requesterName} requested your feedback in ${input.cycleName}.`,
      href
    }
  });

  await transaction.notificationDelivery.create({
    data: {
      notificationId: notification.id,
      userId: input.authorId,
      channel: "EMAIL",
      recipient: input.authorEmail,
      templateKey: "feedback_requested",
      subject: `Feedback requested for ${input.cycleName}`,
      payload: {
        recipientName: input.authorName,
        requesterName: input.requesterName,
        cycleName: input.cycleName,
        actionUrl: new URL(href, env.NEXT_PUBLIC_APP_URL).toString()
      },
      idempotencyKey: `feedback-requested:${input.feedbackId}:email`
    }
  });

  return notification;
}

import "server-only";
import { env } from "@/env";
import { logger } from "@/server/logging/logger";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
};

export async function sendEmail(input: SendEmailInput) {
  if (env.EMAIL_PROVIDER === "local") {
    logger.info("Email delivered by local provider", {
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      idempotencyKey: input.idempotencyKey
    });
    return { provider: "local", id: input.idempotencyKey };
  }

  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": env.POSTMARK_SERVER_TOKEN!
    },
    body: JSON.stringify({
      From: env.EMAIL_FROM,
      To: input.to,
      Subject: input.subject,
      TextBody: input.text,
      HtmlBody: input.html,
      MessageStream: env.POSTMARK_MESSAGE_STREAM,
      Tag: "feedback-requested",
      Metadata: {
        ...input.metadata,
        idempotencyKey: input.idempotencyKey
      }
    }),
    signal: AbortSignal.timeout(10_000)
  });

  const result = (await response.json().catch(() => null)) as
    | { ErrorCode?: number; Message?: string; MessageID?: string }
    | null;
  if (!response.ok || !result || result.ErrorCode !== 0 || !result.MessageID) {
    throw new Error(result?.Message ?? `Postmark request failed with ${response.status}`);
  }

  return { provider: "postmark", id: result.MessageID };
}

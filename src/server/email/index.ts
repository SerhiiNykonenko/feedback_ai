import "server-only";
import { randomUUID } from "node:crypto";
import { env } from "@/env";
import { logger } from "@/server/logging/logger";

export async function sendEmail(input: { to: string; subject: string; text: string }) {
  logger.info("Email queued", { from: env.EMAIL_FROM, to: input.to, subject: input.subject });
  return { provider: "local-log", id: randomUUID() };
}

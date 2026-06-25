import "server-only";
import { logger } from "@/server/logging/logger";

export const monitoring = {
  captureException(error: unknown, context?: Record<string, unknown>) {
    logger.error("Unhandled application exception", {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      context
    });
  },
  captureMessage(message: string, context?: Record<string, unknown>) {
    logger.info(message, context);
  }
};

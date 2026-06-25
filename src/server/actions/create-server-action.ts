import "server-only";
import { z } from "zod";
import type { PermissionKey } from "@/domain/permissions";
import { auth } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit/memory";
import { monitoring } from "@/server/monitoring";

export type ActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export function createServerAction<I, O>(config: {
  permission: PermissionKey | PermissionKey[];
  schema: z.Schema<I>;
  rateLimitKey?: string;
  handler: (
    input: I,
    context: { userId: string; teamId?: string | null; permissions: string[] }
  ) => Promise<O>;
}) {
  return async (rawInput: I): Promise<ActionResult<O>> => {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "Authentication required" };
    const requiredPermissions = Array.isArray(config.permission)
      ? config.permission
      : [config.permission];
    if (!requiredPermissions.some((permission) => session.user.permissions.includes(permission))) {
      return { ok: false, error: "Forbidden" };
    }

    const limited = rateLimit(
      `${config.rateLimitKey ?? requiredPermissions.join("|")}:${session.user.id}`
    );
    if (!limited.allowed) return { ok: false, error: "Too many requests. Try again shortly." };

    const parsed = config.schema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors
      };
    }

    try {
      const data = await config.handler(parsed.data, {
        userId: session.user.id,
        teamId: session.user.teamId,
        permissions: session.user.permissions
      });
      return { ok: true, data };
    } catch (error) {
      monitoring.captureException(error, {
        action: requiredPermissions.join(","),
        userId: session.user.id
      });
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected server error"
      };
    }
  };
}

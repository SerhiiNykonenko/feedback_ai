"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerAction } from "@/server/actions/create-server-action";
import { prisma } from "@/server/db";

const markNotificationReadAction = createServerAction({
  permission: "notifications.read",
  schema: z.object({ id: z.string().min(1) }),
  async handler(input, context) {
    const result = await prisma.notification.updateMany({
      where: { id: input.id, userId: context.userId },
      data: { status: "READ", readAt: new Date() }
    });
    if (result.count !== 1) throw new Error("Notification not found");
    revalidatePath("/", "layout");
    revalidatePath("/profile");
    return { id: input.id };
  }
});

export async function markNotificationRead(
  input: Parameters<typeof markNotificationReadAction>[0]
) {
  return markNotificationReadAction(input);
}

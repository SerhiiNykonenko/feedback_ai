import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getUnreadNotificationCount } from "@/features/notifications/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.permissions.includes("notifications.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const count = await getUnreadNotificationCount(session.user.id);
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}

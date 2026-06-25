import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { globalSearch } from "@/features/search/service";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const results = await globalSearch(
    searchParams.get("q") ?? "",
    session.user.permissions,
    session.user.teamId
  );
  return NextResponse.json(results);
}

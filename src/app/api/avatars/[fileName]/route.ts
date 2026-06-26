import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const allowedFileName = /^[a-zA-Z0-9_-]+\.(jpg|png|webp)$/;
const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await params;
  if (!allowedFileName.test(fileName)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const file = await readFile(path.join(process.cwd(), "uploads", "avatars", fileName));
    const extension = fileName.split(".").pop() ?? "";
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentTypes[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

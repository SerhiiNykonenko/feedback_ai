import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const avatarDirectory = path.join(process.cwd(), "uploads", "avatars");

function detectImage(buffer: Buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { extension: "png", mimeType: "image/png" };
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", mimeType: "image/webp" };
  }
  return null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const formData = await request.formData();
  const avatar = formData.get("avatar");
  if (!(avatar instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 });
  }
  if (avatar.size === 0 || avatar.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "Avatar must be smaller than 2 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await avatar.arrayBuffer());
  const imageType = detectImage(buffer);
  if (!imageType) {
    return NextResponse.json({ error: "Only JPG, PNG and WebP images are supported" }, { status: 400 });
  }

  await mkdir(avatarDirectory, { recursive: true });
  const fileName = `${session.user.id}-${randomUUID()}.${imageType.extension}`;
  await writeFile(path.join(avatarDirectory, fileName), buffer, { flag: "wx" });

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true }
  });
  const image = `/api/avatars/${fileName}`;
  await prisma.user.update({ where: { id: session.user.id }, data: { image } });

  if (currentUser?.image?.startsWith("/api/avatars/")) {
    const previousFile = path.basename(currentUser.image);
    if (previousFile !== fileName) {
      await unlink(path.join(avatarDirectory, previousFile)).catch(() => undefined);
    }
  }

  return NextResponse.json({ image, mimeType: imageType.mimeType });
}

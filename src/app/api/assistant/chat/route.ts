import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit/memory";
import { logger } from "@/server/logging/logger";
import { assistantChatSchema } from "@/features/assistant/schemas";
import { buildAssistantSystemPrompt } from "@/features/assistant/knowledge";
import { chatWithLocalModel } from "@/server/ai/llama-cpp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.permissions.includes("assistant.use")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`assistant.chat:${session.user.id}`, 12, 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many questions. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = assistantChatSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat request" }, { status: 400 });
  }

  try {
    const latestQuestion = parsed.data.messages.at(-1)!.content;
    const content = await chatWithLocalModel([
      {
        role: "system",
        content: buildAssistantSystemPrompt(session.user.permissions, latestQuestion)
      },
      ...parsed.data.messages
    ]);
    return NextResponse.json({ message: { role: "assistant", content } });
  } catch (error) {
    logger.error("Local AI assistant failed", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      {
        error:
          "The local AI assistant is unavailable. Ask an administrator to start the llama.cpp service."
      },
      { status: 503 }
    );
  }
}

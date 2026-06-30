import "server-only";
import { z } from "zod";
import { env } from "@/env";
import type { AssistantMessage } from "@/features/assistant/schemas";

const chatCompletionSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().min(1) })
      })
    )
    .min(1)
});

export async function chatWithLocalModel(
  messages: Array<AssistantMessage | { role: "system"; content: string }>
) {
  const baseUrl = env.LLM_BASE_URL.endsWith("/") ? env.LLM_BASE_URL : `${env.LLM_BASE_URL}/`;
  const response = await fetch(new URL("chat/completions", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 450,
      chat_template_kwargs: { enable_thinking: false }
    }),
    signal: AbortSignal.timeout(env.AI_CHAT_TIMEOUT_MS)
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`llama.cpp returned ${response.status}: ${details.slice(0, 300)}`);
  }

  return chatCompletionSchema.parse(await response.json()).choices[0].message.content.trim();
}

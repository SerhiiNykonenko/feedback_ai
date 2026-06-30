import { z } from "zod";

export const assistantMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1500)
});

export const assistantChatSchema = z
  .object({
    messages: z.array(assistantMessageSchema).min(1).max(12)
  })
  .superRefine((value, context) => {
    if (value.messages.at(-1)?.role !== "user") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["messages"],
        message: "The last message must be from the user"
      });
    }
    const totalCharacters = value.messages.reduce(
      (total, message) => total + message.content.length,
      0
    );
    if (totalCharacters > 8000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["messages"],
        message: "Conversation is too long"
      });
    }
  });

export type AssistantMessage = z.infer<typeof assistantMessageSchema>;

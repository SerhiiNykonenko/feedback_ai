import { z } from "zod";

export const questionTypeSchema = z.enum([
  "TEXT",
  "LONG_TEXT",
  "RATING_1_5",
  "RATING_1_10",
  "EMOJI_SCALE",
  "MULTIPLE_CHOICE",
  "MULTI_SELECT",
  "BOOLEAN"
]);

export function answerValueSchema(
  type: z.infer<typeof questionTypeSchema>,
  options: string[] = []
) {
  switch (type) {
    case "TEXT":
      return z.string().trim().min(1).max(300);
    case "LONG_TEXT":
      return z.string().trim().min(1).max(5000);
    case "RATING_1_5":
      return z.number().int().min(1).max(5);
    case "RATING_1_10":
      return z.number().int().min(1).max(10);
    case "EMOJI_SCALE":
      return z.enum(["terrible", "poor", "neutral", "good", "excellent"]);
    case "MULTIPLE_CHOICE":
      return z.string().refine((value) => options.includes(value), "Invalid option");
    case "MULTI_SELECT":
      return z
        .array(z.string())
        .refine((values) => values.every((value) => options.includes(value)), "Invalid option");
    case "BOOLEAN":
      return z.boolean();
  }
}

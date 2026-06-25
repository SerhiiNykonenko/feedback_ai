import { z } from "zod";
import { questionTypeSchema } from "@/domain/question-validation";

export const templateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  sections: z
    .array(
      z.object({
        title: z.string().trim().min(2).max(120),
        questions: z.array(
          z.object({
            prompt: z.string().trim().min(3).max(300),
            type: questionTypeSchema,
            required: z.boolean().default(true),
            options: z.array(z.string().trim().min(1)).optional()
          })
        )
      })
    )
    .min(1)
});

export const deleteTemplateSchema = z.object({
  id: z.string().min(1)
});

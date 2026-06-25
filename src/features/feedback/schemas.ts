import { z } from "zod";

export const saveDraftSchema = z.object({
  feedbackId: z.string().min(1),
  answers: z
    .array(z.object({ questionId: z.string().min(1), value: z.unknown() }))
    .refine(
      (answers) => new Set(answers.map((answer) => answer.questionId)).size === answers.length,
      "Duplicate answers are not allowed"
    )
});

export const submitFeedbackSchema = z.object({
  feedbackId: z.string().min(1)
});

export const commentSchema = z.object({
  feedbackId: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
  mentions: z.array(z.string()).default([])
});

export const requestFeedbackSchema = z.object({
  cycleId: z.string().min(1),
  subjectId: z.string().min(1),
  authorId: z.string().min(1)
});

export const transitionFeedbackSchema = z.object({
  feedbackId: z.string().min(1),
  targetStatus: z.enum(["UNDER_REVIEW", "APPROVED", "PUBLISHED"])
});

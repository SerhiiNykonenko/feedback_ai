import { z } from "zod";

export const reviewCycleSchema = z.object({
  name: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional(),
  type: z.enum([
    "PERFORMANCE",
    "PEER",
    "FEEDBACK_360",
    "MANAGER",
    "SELF",
    "PROBATION",
    "PROMOTION",
    "CONTINUOUS"
  ]),
  templateId: z.string().min(1),
  productId: z.string().optional(),
  teamId: z.string().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional()
});

export const transitionCycleSchema = z.object({
  id: z.string().min(1),
  targetStatus: z.enum(["ACTIVE", "CLOSED", "ARCHIVED"])
});

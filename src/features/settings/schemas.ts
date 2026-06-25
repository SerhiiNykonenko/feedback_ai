import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional()
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  productId: z.string().optional()
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  title: z.string().trim().max(120).optional(),
  password: z.string().min(8).max(128),
  teamId: z.string().optional(),
  roleKey: z.enum(["employee", "manager", "hr", "admin"])
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  roleKey: z.enum(["employee", "manager", "hr", "admin"])
});

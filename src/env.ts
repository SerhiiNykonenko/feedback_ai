import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.string().optional(),
  EMAIL_FROM: z.string().min(3).default("Feedback AI <no-reply@example.com>"),
  EMAIL_PROVIDER: z.enum(["local", "postmark"]).default("local"),
  POSTMARK_SERVER_TOKEN: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(10).optional()
  ),
  POSTMARK_MESSAGE_STREAM: z.string().min(1).default("outbound"),
  NOTIFICATION_WORKER_SECRET: z.string().min(32).optional(),
  LLM_BASE_URL: z.string().url().default("http://localhost:8080/v1/"),
  LLM_MODEL: z.string().min(1).default("qwen3-4b"),
  AI_CHAT_TIMEOUT_MS: z.coerce.number().int().positive().default(180_000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DEMO_AUTH_FALLBACK: z
    .string()
    .optional()
    .transform((value) => value === "true")
}).superRefine((value, context) => {
  if (value.EMAIL_PROVIDER === "postmark" && !value.POSTMARK_SERVER_TOKEN) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["POSTMARK_SERVER_TOKEN"],
      message: "POSTMARK_SERVER_TOKEN is required when EMAIL_PROVIDER=postmark"
    });
  }
});

export const env = envSchema.parse(process.env);

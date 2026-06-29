# API Design

## Server Actions

All mutation actions use `createServerAction`, which enforces:

- authenticated session
- permission check
- in-memory rate limit suitable for local development
- Zod input validation
- structured `ActionResult<T>` response
- monitoring capture on failure

Implemented actions:

- `createReviewCycle`
- `transitionReviewCycle`
- `createTemplate`
- `saveFeedbackDraft`
- `submitFeedback`
- `addFeedbackComment`
- `markNotificationRead`

## Route Handlers

- `GET /api/search?q=` returns RBAC-scoped results across users, products, teams, and review cycles.
- `GET|POST /api/auth/[...nextauth]` is handled by Auth.js.

## Future Production Adapters

The code keeps adapter boundaries for email, monitoring, storage, and rate limiting. For production, replace the local email logger and memory rate limiter with durable providers such as SES/Postmark and Redis.

`POST /api/internal/notifications/process` is a worker-only endpoint protected by
`NOTIFICATION_WORKER_SECRET`. It atomically claims pending email deliveries, sends them through the
configured provider, and records retry or terminal delivery state. Production should invoke it from
a private scheduler; Docker Compose runs the bundled worker process for local development.

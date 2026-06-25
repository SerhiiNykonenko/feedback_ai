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

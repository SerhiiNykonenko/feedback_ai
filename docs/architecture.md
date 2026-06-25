# Feedback Management System Architecture

This document is intentionally written before implementation. It records the main architectural and technology decisions, their tradeoffs, expected failure points, and improvements that protect long-term maintainability.

## 1. Architecture Plan

### Clean Architecture Breakdown

The system uses feature-first Clean Architecture inside a Next.js 15 App Router application. The dependency rule is:

`app routes -> feature UI/actions -> application services -> domain policies/types -> infrastructure adapters`

Outer layers may import inward. Inner layers must not import Next.js request APIs, Prisma clients, React components, or browser APIs.

- `src/app`: route segments, layouts, route handlers, page composition, metadata, middleware-facing pages.
- `src/features/*`: feature modules with UI, server actions, query hooks, schemas, and service entrypoints.
- `src/domain`: cross-feature domain types, RBAC definitions, workflow state machines, audit event contracts.
- `src/server`: infrastructure adapters for auth, Prisma, logging, rate limiting, email, storage, search, monitoring, and action wrappers.
- `src/components`: reusable design-system components and app shell components.
- `src/lib`: small framework-agnostic utilities.
- `prisma`: schema and seed data.
- `tests`: unit, integration-style component tests, and Playwright E2E tests.

### Feature Module Map

| Module        | Responsibility                                                         | Primary Dependencies                  |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| Auth          | Session handling, login/logout flows, secure user context              | NextAuth, Prisma, RBAC                |
| RBAC          | Permission matrix, route/action guards, Playwright coverage            | Domain permissions, auth context      |
| Dashboard     | Pending work, activity, employee/team metrics summaries                | Feedback, review cycles, analytics    |
| Review Cycles | Cycle CRUD, lifecycle transitions, workflow configuration              | Templates, feedback, audit logs       |
| Templates     | Built-in and custom templates, sections, questions                     | Zod validation, Prisma                |
| Feedback      | Draft autosave, submission, approvals, comments, mentions, attachments | Workflow, notifications, audit        |
| Analytics     | Employee/team/org score summaries and trends                           | Feedback answers, Prisma aggregations |
| Notifications | In-app notifications and email dispatch points                         | Email adapter, audit logs             |
| Search        | Debounced server-side search across people/products/teams/cycles       | Prisma text indexes                   |
| Settings      | Users, teams, products, roles, system configuration                    | RBAC, audit logs                      |
| Profile       | Current user profile, preferences, notification settings               | Auth, users                           |

### Data Flow Diagram

```text
Browser UI
  |
  | React Hook Form + Zod client validation
  | TanStack Query optimistic updates
  v
Next.js Server Action / Route Handler
  |
  | authenticate -> authorize -> rate limit -> validate Zod input
  v
Application Service
  |
  | domain state checks, workflow checks, audit event creation
  v
Repository Adapter
  |
  | Prisma transaction, indexed queries, pagination
  v
PostgreSQL
  |
  | side effects after commit
  v
Notification + Email Adapter + Monitoring Hook
```

Server Actions are used for authenticated mutations and small server reads that benefit from colocated form handling. Route handlers are used for search, file upload metadata, health checks, and APIs that need HTTP semantics, streaming, or debounced fetch access.

### Dependency Graph

```text
src/app
  -> src/features
  -> src/components
  -> src/server/auth

src/features
  -> src/domain
  -> src/server/actions
  -> src/server/repositories
  -> src/components

src/server
  -> src/domain
  -> prisma/client
  -> src/lib

src/domain
  -> no framework dependencies

tests
  -> app pages, feature components, domain policies, server action wrappers
```

### Folder Structure

```text
.
+-- docs/
+-- prisma/
|   +-- schema.prisma
|   +-- seed.ts
+-- src/
|   +-- app/
|   |   +-- (auth)/login/
|   |   +-- (app)/dashboard/
|   |   +-- (app)/reviews/
|   |   +-- (app)/templates/
|   |   +-- (app)/analytics/
|   |   +-- (app)/settings/
|   |   +-- (app)/profile/
|   |   +-- api/
|   |   +-- layout.tsx
|   +-- components/
|   |   +-- shell/
|   |   +-- ui/
|   +-- domain/
|   +-- features/
|   |   +-- analytics/
|   |   +-- dashboard/
|   |   +-- feedback/
|   |   +-- notifications/
|   |   +-- review-cycles/
|   |   +-- search/
|   |   +-- settings/
|   |   +-- templates/
|   +-- lib/
|   +-- server/
|   |   +-- actions/
|   |   +-- auth/
|   |   +-- email/
|   |   +-- logging/
|   |   +-- monitoring/
|   |   +-- rate-limit/
|   |   +-- repositories/
|   |   +-- storage/
|   +-- test/
+-- tests/
|   +-- e2e/
|   +-- unit/
+-- .github/workflows/
```

## 2. Tradeoff Analysis

### Next.js App Router with Server Actions

Decision: Use Server Actions for authenticated mutations and route handlers for search, health, auth, and upload-facing endpoints.

Why: The requested stack favors colocated mutations and avoids maintaining a separate API server. Server Actions reduce boilerplate for form workflows and keep auth/validation close to use cases.

Alternatives considered:

- Separate REST or GraphQL backend: clearer API boundary and easier external integrations, but more operational complexity for this project.
- tRPC: strong type safety for client/server calls, but not requested and adds another architectural convention.

Failure points and mitigations:

- Server Actions can become unstructured. Mitigation: all actions go through `createServerAction`, which enforces auth, RBAC, validation, rate limiting, logging, and typed results.
- Long-running work can block requests. Mitigation: email/monitoring are adapter boundaries and can later move to a queue without changing feature code.

### Prisma with PostgreSQL

Decision: Prisma models are normalized for core entities, with JSON used only where the shape is legitimately configurable, such as workflow step configuration and answer values.

Why: Review systems need queryable relational data for reporting, permissions, ownership, and auditability. PostgreSQL gives indexes, constraints, JSONB, transactions, and future full-text search.

Alternatives considered:

- Fully document-based answers/templates: flexible but weak for analytics and consistency.
- Event-sourced feedback: excellent audit history but too heavy for the initial operational scope.

Failure points and mitigations:

- Analytics queries can become expensive. Mitigation: explicit indexes, pagination, scoped filters, and a future-ready `analytics` service boundary for materialized views.
- JSON answer values can drift. Mitigation: question-type Zod validation before write and immutable question snapshots on submitted feedback.

### Feature-First Clean Architecture

Decision: Organize by business feature, while keeping domain policies and infrastructure adapters shared.

Why: Teams working on review cycles, templates, analytics, and notifications can evolve independently without scattering feature logic across global `services`, `components`, and `hooks` folders.

Alternatives considered:

- Layer-only folders: simple at first but creates cross-feature coupling as the app grows.
- Microfrontends: unnecessary for a 1000+ employee internal SaaS unless organizational boundaries later demand it.

Failure points and mitigations:

- Shared code can become a dumping ground. Mitigation: shared code must be either reusable UI, domain policy, or infrastructure. Feature-specific code stays in its feature.

### RBAC Design

Decision: Use role-permission assignments in the database plus a code-owned permission catalog. Route and Server Action guards both check permissions.

Why: Product admins need configurable roles over time, while engineers need a deterministic permission catalog for tests and secure defaults.

Alternatives considered:

- Hard-coded role checks only: simpler but brittle and hard to customize.
- Full ABAC policy engine: powerful but costly to understand and test.

Failure points and mitigations:

- Route protection without action protection is unsafe. Mitigation: every action declares required permissions, and Playwright covers all four roles against routes and critical flows.
- Team-scoped access is more nuanced than global roles. Mitigation: repository filters enforce ownership and team membership where data scope matters.

### Design System

Decision: Use Tailwind tokens with shadcn/ui-style primitives, compact enterprise SaaS layouts, light/dark themes, skeletons, empty states, and keyboard-accessible controls.

Why: The app needs to feel fast and clear under daily use. Design tokens reduce drift and make future redesigns cheaper.

Alternatives considered:

- Heavy component framework: faster initially, but harder to shape into a high-quality product experience.
- CSS modules only: good isolation, weaker token enforcement and slower UI assembly.

Failure points and mitigations:

- Dashboard clutter can reduce comprehension. Mitigation: prioritize task cards, clear status badges, consistent density, and explicit empty/loading/error states.

## 3. Risk Register

| Risk                               | Impact                                 | Mitigation                                                                        |
| ---------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| Missing action-level RBAC          | Sensitive data exposure                | `requirePermission` in every Server Action and route guard; E2E role matrix tests |
| Overly broad manager visibility    | Privacy issue                          | Repository-level team scoping; audit log for sensitive reads/mutations            |
| Feedback workflow misconfiguration | Reviews stuck or published incorrectly | Validate workflow transitions and require at least one terminal published state   |
| Autosave race conditions           | Lost draft answers                     | Optimistic UI with server timestamps and last-write conflict checks               |
| Large analytics queries            | Slow dashboards                        | Indexed foreign keys, time filters, pagination, aggregation service boundary      |
| Search result leakage              | Cross-team data exposure               | Search service applies same RBAC scope as normal repositories                     |
| File attachment abuse              | Malware or storage exhaustion          | Metadata validation, size/type allowlist, storage adapter, future virus scan hook |
| Email delivery failures            | Users miss review tasks                | In-app notification is source of truth; email errors logged and retry-ready       |
| Role/permission drift              | Broken access model                    | Seeded permission catalog, unit tests for permission matrix, audit logs           |
| Inaccessible custom controls       | WCAG failure and poor UX               | Semantic controls, focus states, labels, keyboard tests for critical flows        |
| NextAuth misconfiguration          | Session hijacking or weak cookies      | strict env validation, secure cookies in production, short-lived sessions         |
| JSON answer validation gaps        | Bad analytics data                     | Per-question validation with discriminated Zod schemas before persistence         |
| No queue for background jobs       | Slow submissions under load            | Adapter boundary now, queue migration path later                                  |
| Seed data unrealistic              | Poor development/testing signal        | Seed includes roles, teams, products, cycles, templates, feedback, notifications  |

## 4. Proposed Improvements

- Add a typed `ActionResult<T>` contract for every Server Action so errors are structured and UI behavior is consistent.
- Use immutable template/question snapshots on each feedback record so historical reviews remain stable when templates change.
- Add a notification outbox table later if email delivery must become guaranteed across process crashes.
- Add materialized analytics tables once the feedback dataset grows beyond what indexed live aggregation can comfortably support.
- Add object storage and virus scanning integration for production attachments; local development uses metadata-only seeded files.
- Add audit logs for permission changes, workflow transitions, approvals, publishing, template edits, and user/team/product administration.
- Add a monitoring adapter with Sentry/Datadog-compatible methods now, even if it only logs locally at first.
- Prefer route groups and server-side data loading for first paint, with TanStack Query focused on client interactivity and optimistic updates.
- Treat organization analytics as HR/Admin-only by default, even when managers can view team analytics.

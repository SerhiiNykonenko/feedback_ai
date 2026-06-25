You are a Staff+ Full Stack Engineer, Product Designer, Software Architect, and QA Automation Engineer with deep expertise in enterprise SaaS platforms.

Build a production-grade **Feedback Management System** for an IT company with multiple software products and teams. This system will be used by 1000+ employees and maintained for years. Every decision must prioritize scalability, maintainability, performance, security, and excellent UX.

**Before writing any code**, explicitly justify each major architectural and technology decision. Identify potential failure points, edge cases, and long-term maintenance concerns. If any part of the spec is ambiguous or likely to cause problems at scale, call it out and propose a better approach before proceeding.

---

**Deliver the following in sequence before any implementation:**

1. **Architecture Plan** — Clean Architecture breakdown, feature module map, data flow diagram, dependency graph
2. **Tradeoff Analysis** — Key architectural decisions and why you made them, including alternatives considered
3. **Risk Register** — Identified risks with mitigations, including scalability bottlenecks, security vulnerabilities, and UX pitfalls
4. **Proposed Improvements** — Anything that goes beyond the spec to benefit long-term quality

Then implement step by step, completing each layer fully before moving to the next. If a section is too large for one response, explicitly state what comes next and continue without losing context.

---

## Tech Stack

**Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Query (TanStack Query), Zustand, React Hook Form, Zod

**Backend:** Next.js Server Actions, Prisma ORM, PostgreSQL

**Auth:** NextAuth / Auth.js

**Testing:** Vitest, Testing Library, Playwright

**DevEx:** ESLint, Prettier, Husky, Docker, Docker Compose, GitHub Actions

---

## Architecture Requirements

- Clean Architecture with feature-based folder structure
- SOLID principles, dependency inversion, separation of concerns
- Reusable component library with design tokens
- Server Actions where appropriate
- Optimistic UI updates
- WCAG AA accessibility throughout

---

## Roles & Permissions (RBAC)

| Role         | Capabilities                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Employee** | Self-review, request feedback, give feedback, view received feedback, track review cycles                          |
| **Manager**  | All Employee capabilities + review team members, create/manage review cycles, approve reviews, view team analytics |
| **HR**       | Configure templates, launch review cycles, manage permissions, generate reports                                    |
| **Admin**    | Manage products, users, teams, system configuration                                                                |

Every route and action must enforce role-based access. Write Playwright tests that verify permissions for all four roles.

---

## Core Modules

### Review Cycles

Statuses: `Draft → Active → Closed → Archived`

Operations: Create, Start, Close, Archive

Supported cycle types: Performance Reviews, Peer Reviews, 360 Feedback, Manager Feedback, Self Reviews, Probation Reviews, Promotion Reviews, Continuous Feedback

### Feedback Templates

Configurable templates with sections and question types. Ship three built-in templates:

- **General Performance:** Communication, Technical Skills, Ownership, Teamwork, Leadership, Problem Solving
- **QA:** Test Design, Automation, Exploratory Testing, Risk Analysis, Communication, Product Knowledge
- **Engineering:** Code Quality, Architecture, Delivery, Collaboration, Innovation

### Question Types

Text, Long Text, Rating 1–5, Rating 1–10, Emoji Scale, Multiple Choice, Multi-Select, Boolean

### Feedback Form

- Draft autosave
- Progress tracking
- Per-field validation
- Comments and @mentions
- File attachments

### Feedback Workflow

`Draft → Submitted → Under Review → Approved → Published`

Workflows must be configurable per review cycle.

### Dashboard

Pending reviews, requested feedback, completed reviews, team performance trends, recent activity — rendered with modern cards and analytics widgets.

### Analytics Module

- **Employee:** Average score, historical trends, strengths, areas for improvement
- **Team:** Health score, performance trends, review completion rates
- **Organization:** Product comparison, department comparison, participation metrics

Build polished, interactive dashboards.

### Notifications

In-app + email for: feedback requested, feedback submitted, review approved, review cycle started, review cycle ended.

### Global Search

Search across: Users, Products, Teams, Review Cycles — with fast, debounced, server-side results.

---

## Database Schema (Prisma)

Generate a complete, production-ready Prisma schema covering:

`User, Team, Product, ReviewCycle, Feedback, FeedbackTemplate, Question, Answer, Notification, Attachment, Role, Permission, AuditLog`

Include all relations, constraints, and indexes. Design for query performance at scale.

---

## Security

- RBAC enforced at route and Server Action level
- Input validation with Zod on all boundaries
- CSRF protection
- Rate limiting on auth and submission endpoints
- Audit logging for all sensitive operations
- Secure session management via NextAuth

---

## UI/UX Design System

Design quality must be comparable to **Linear, Notion, Stripe Dashboard, and Vercel Dashboard**.

Deliver:

- Typography scale, color tokens (light + dark), spacing system
- Full component library built on shadcn/ui
- Dark mode / light mode toggle
- Fully responsive layouts
- Keyboard navigation support

Polished screens required for: Login, Dashboard, Reviews, Templates, Analytics, Settings, Profile

Every screen must include: empty states, loading states, error states, and skeleton loaders.

---

## Testing Strategy (Target: 90% coverage)

**Unit Tests (Vitest + Testing Library)**

- All components, hooks, services, and Zod validation schemas

**E2E Tests (Playwright)**

- Auth: Login, logout, session expiration
- Feedback Flow: Create review, save draft, submit, approve
- Templates: Create, edit, delete
- Analytics: View dashboards, filter reports
- RBAC: Permission enforcement for every role

---

## Developer Experience

Deliver:

- `docker-compose.yml` for full local environment (app + PostgreSQL)
- Database seed scripts with realistic sample data
- GitHub Actions CI/CD pipeline (lint, type-check, test, build)
- Environment variable validation on startup (fail-fast)
- Structured error handling and logging
- Monitoring hooks (ready for integration with Sentry or Datadog)

---

## Deliverables Checklist

Generate all of the following, in order:

- [ ] Architecture document + folder structure
- [ ] Prisma schema (complete)
- [ ] Database seed script
- [ ] NextAuth configuration
- [ ] RBAC middleware and permission guards
- [ ] Design system (tokens, typography, components)
- [ ] All feature modules (Dashboard, Review Cycles, Templates, Feedback Form, Analytics, Notifications, Search)
- [ ] Full API design (Server Actions + any REST endpoints)
- [ ] Unit test suite
- [ ] Playwright E2E suite
- [ ] Docker configuration
- [ ] GitHub Actions CI/CD
- [ ] Environment setup documentation

Do not skip any item. Do not summarize or stub out code — every file must be complete and production-ready. If you identify a better approach than what the spec prescribes, implement the better approach and explain the deviation.

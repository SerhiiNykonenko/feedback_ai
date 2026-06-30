# Feedback AI

Production-oriented feedback management system for software organizations.

## Local Setup

### Full Docker Environment

1. Install and start Docker Desktop with the WSL 2 backend.
2. Copy `.env.example` to `.env` and replace `AUTH_SECRET`.
3. Run `docker compose up --build -d`.
4. Open `http://localhost:3000`.

The Compose stack starts PostgreSQL, waits for it to become healthy, pushes the Prisma schema, seeds realistic data, and then starts the application.

### Transactional email

Docker starts a notification worker that processes the PostgreSQL-backed delivery outbox. The
default `EMAIL_PROVIDER=local` records deliveries in application logs without sending externally.
To enable Postmark, configure a verified sender and set:

- `EMAIL_PROVIDER=postmark`
- `EMAIL_FROM=Feedback AI <feedback@your-verified-domain.com>`
- `POSTMARK_SERVER_TOKEN`
- `NOTIFICATION_WORKER_SECRET` to a unique value of at least 32 characters

The worker retries transient failures with exponential backoff. The protected processing endpoint
can be called by a private scheduler outside Docker.

### Local OSS AI guide

The authenticated product guide uses only local OSS components: llama.cpp (MIT) and the official
`Qwen/Qwen3-4B-GGUF:Q4_K_M` model (Apache 2.0). A deterministic bilingual retrieval layer selects
relevant product-help articles for each question and filters role-specific guidance by permissions.
The assistant has no database tools and cannot read feedback content.

Start the application with the optional AI profile:

```bash
docker compose --profile ai up -d --build
```

The first start downloads the lightweight pinned llama.cpp server image and the approximately 2.5
GB Q4 model, so it can take several minutes. CPU inference is supported; response time depends on
the device. Use `docker compose --profile ai logs -f llama` to monitor model loading. Native
development can point `LLM_BASE_URL` at an OpenAI-compatible local llama.cpp server.

If antivirus HTTPS scanning replaces TLS certificates inside containers, export its public root CA and pass it to the build as the optional BuildKit secret named `local_ca`. The certificate is ignored by Git and is not stored in image layers.

Useful commands:

- `docker compose ps`
- `docker compose logs -f app`
- `docker compose logs -f db-init`
- `docker compose down`
- `docker compose down -v` to also delete local database data

### Native Application with Docker PostgreSQL

1. Run `docker compose up postgres -d`.
2. Install dependencies with `npm install`.
3. Generate Prisma client with `npm run db:generate`.
4. Push the schema with `npx prisma db push`.
5. Seed realistic data with `npm run db:seed`.
6. Run the app with `npm run dev`.

Seeded login accounts all use `Password123!`:

- `nykonenko_sv@groupbwt.com`
- `nykonenko_sv+manager@groupbwt.com`
- `nykonenko_sv+hr@groupbwt.com`
- `nykonenko_sv+admin@groupbwt.com`
- `nykonenko_sv+qa@groupbwt.com`

For local development, `.env` sets `DEMO_AUTH_FALLBACK="true"`. If PostgreSQL is not running, these same accounts still sign in with demo data so the UI can be reviewed. With PostgreSQL available, the app uses the database-backed Auth.js and Prisma flow.

## Verification

- `npm run lint`
- `npm run type-check`
- `npm test`
- `npm run test:e2e`
- `npm run build`

## Manual QA

Покроковий опис ролей, permissions і feedback workflow:

- [QA-гайд: ролі та feedback workflow](docs/qa-role-guide-uk.md)

## Architecture

Read `docs/architecture.md` before making structural changes. It defines the Clean Architecture boundaries, tradeoffs, risks, and improvement path.

# External Integrations

**Analysis Date:** 2026-02-14

## APIs & External Services

**No third-party SaaS integrations:**
- This application does not integrate with external APIs (Stripe, SendGrid, AWS SDK, etc.)
- All functionality is self-contained using MongoDB and native Node/browser APIs

## Data Storage

**Databases:**
- MongoDB Atlas (cloud-hosted MongoDB)
  - Connection: MongoDB+srv protocol via environment variables
  - Client: Native MongoDB driver (`mongodb` package v6.17.0)
  - Database configuration:
    - `MONGO_USER` - Atlas database user
    - `MONGO_PWD` - Atlas password
    - `MONGO_CLUSTER` - Cluster hostname (e.g., `cluster0.abc123.mongodb.net`)
    - `DB_NAME` - Target database name
  - Connection URL: `mongodb+srv://{MONGO_USER}:{MONGO_PWD}@{MONGO_CLUSTER}/{DB_NAME}?appName=BudgetTrackerDB`
  - Connection module: `packages/backend/src/mongo.database.ts`
  - Collections (configured via environment variables):
    - Users (`USERS_COLLECTION_NAME`)
    - User credentials (`CREDS_COLLECTION_NAME`)
    - Charges (`CHARGES_COLLECTION_NAME`)
    - Categories (`CATEGORIES_COLLECTION_NAME`)
    - Net worth entries (`NETWORTH_COLLECTION_NAME`)

**File Storage:**
- Local filesystem only
  - Static files served from `STATIC_DIR` environment variable (defaults to `"public"`)
  - Frontend build artifacts served from `packages/frontend/dist/`

**Caching:**
- None (no Redis, Memcached, or in-memory caching layer)
- MongoDB connection singleton cached in `packages/backend/src/mongo.database.ts`

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: `packages/backend/src/services/credential.service.ts`
  - Middleware: `packages/backend/src/middleware/auth.middleware.ts`
  - Password hashing: bcrypt (10 salt rounds)
  - JWT signing/verification: jsonwebtoken package
  - Secret: `JWT_SECRET` environment variable
  - Token payload: `{ id: string, username: string }`
  - Token storage (frontend): localStorage
  - Token format: `Authorization: Bearer <token>`
  - Public routes: `/api/public/login`, `/api/public/register`
  - Protected routes: All `/api/*` routes require `verifyAuthToken` middleware

**Token expiration handling:**
- Frontend wrapper: `packages/frontend/src/api/auth.ts` - `authFetch()` intercepts 401 responses
- Expired token flow: Clear localStorage, dispatch `"auth:expired"` window event, redirect to login

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Rollbar, or similar service)

**Logs:**
- Console logging only (stdout/stderr)
- No structured logging service (Datadog, LogRocket, etc.)

## CI/CD & Deployment

**Hosting:**
- Not detected (no Vercel, Netlify, or cloud platform config files found)

**CI Pipeline:**
- None (no GitHub Actions, CircleCI, or other CI config found)

## Environment Configuration

**Required env vars:**
- `MONGO_USER` - MongoDB Atlas username
- `MONGO_PWD` - MongoDB Atlas password
- `MONGO_CLUSTER` - Atlas cluster hostname
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing secret
- `USERS_COLLECTION_NAME` - Users collection name
- `CREDS_COLLECTION_NAME` - Credentials collection name
- `CHARGES_COLLECTION_NAME` - Charges collection name
- `CATEGORIES_COLLECTION_NAME` - Categories collection name
- `NETWORTH_COLLECTION_NAME` - Net worth collection name

**Optional env vars:**
- `PORT` - HTTP server port (defaults to 3000)
- `STATIC_DIR` - Static file directory (defaults to "public")

**Secrets location:**
- Development: `packages/backend/.env` (gitignored)
- Production: Environment-dependent (not configured in codebase)

## Webhooks & Callbacks

**Incoming:**
- None (no webhook endpoints for Stripe, GitHub, Slack, etc.)

**Outgoing:**
- None (no outbound webhooks to external services)

## Internal API Communication

**Frontend-to-Backend:**
- Development: Vite proxy forwards `/api/` and `/auth/` requests to `http://localhost:3000`
  - Config: `packages/frontend/vite.config.ts`
- Production: Same-origin requests (frontend served from backend Express static middleware)
- HTTP client: Native `fetch` API
  - Authenticated requests: `authFetch()` wrapper in `packages/frontend/src/api/auth.ts`
  - Public requests: Direct `fetch()` calls

**API Endpoints:**
- Public: `/api/public/login`, `/api/public/register`
- Protected (require JWT):
  - `/api/auth/userId` - Get user ID from token
  - `/api/user/:userId/summary` - User summary data
  - `/api/charge/*` - Charge management
  - `/api/category/*` - Category management
  - `/api/networth/*` - Net worth tracking

---

*Integration audit: 2026-02-14*

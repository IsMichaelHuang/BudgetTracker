# BudgetTracker Backend

Express.js REST API with MongoDB Atlas for the BudgetTracker application. Handles user authentication, budget categories, expense tracking, and financial summary aggregation.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 4
- **Database:** MongoDB Atlas (native driver, no Mongoose)
- **Auth:** bcrypt password hashing + JWT (2-hour expiry)
- **Testing:** Vitest + Supertest

## Project Structure

```
src/
├── index.ts                 # Entry point — loads .env, connects MongoDB, starts server
├── app.ts                   # Express app config — middleware, routes, JWT setup
├── mongo.database.ts        # MongoDB Atlas connection singleton
├── middleware/
│   ├── auth.middleware.ts    # JWT Bearer token verification
│   ├── validate.middleware.ts # Body schemas, UUID path params
│   └── dbError.middleware.ts  # Maps pg errors to 400/404
├── validation/              # zod request schemas (strict)
├── controllers/
│   ├── credential.controller.ts   # Register, login, getUserId handlers
│   ├── charge.controller.ts       # Charge CRUD handlers
│   ├── category.controller.ts     # Category CRUD handlers
│   ├── netWorth.controller.ts     # Net worth CRUD handlers
│   └── summary.controller.ts      # Dashboard summary handler
├── services/
│   ├── base.service.ts            # Generic CRUD base class
│   ├── credential.service.ts      # Auth logic (bcrypt, JWT generation)
│   ├── charge.service.ts          # Charge operations
│   ├── category.service.ts        # Category ops + cascade delete
│   ├── netWorth.service.ts        # Net worth operations
│   └── summary.service.ts         # Multi-step aggregation pipeline
├── routes/
│   ├── credential.route.ts        # Public and auth routers
│   ├── charge.route.ts            # PATCH/DELETE /:id, PUT /new
│   ├── category.route.ts          # PATCH/DELETE /:id, PUT /new
│   ├── netWorth.route.ts          # GET /:userId, PUT, PATCH, DELETE
│   └── summary.route.ts           # GET /:id
├── types/                   # TypeScript interfaces for MongoDB documents
├── shared/                  # Route constants
├── common/                  # Mock data for development
└── __tests__/               # Vitest integration tests 
```

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/public/register` | No | Register a new user |
| `POST` | `/api/public/login` | No | Login, returns JWT |
| `GET` | `/api/auth/userId` | Yes | Resolve credential to user ID |
| `GET` | `/api/user/:id` | Yes | Full financial summary |
| `PATCH` | `/api/category/:id` | Yes | Update a category |
| `PUT` | `/api/category/new` | Yes | Create a category |
| `DELETE` | `/api/category/:id` | Yes | Delete category + its charges |
| `PATCH` | `/api/charge/:id` | Yes | Update a charge |
| `PUT` | `/api/charge/new` | Yes | Create a charge |
| `DELETE` | `/api/charge/:id` | Yes | Delete a charge |
| `GET` | `/api/networth/:userId` | Yes | List your net worth items |
| `PUT` | `/api/networth/new` | Yes | Create a net worth item |
| `PATCH` | `/api/networth/:id` | Yes | Update a net worth item |
| `DELETE` | `/api/networth/:id` | Yes | Delete a net worth item |

## Authentication

Login returns a JWT. Clients send it as `Authorization: Bearer <token>`.

- Claims: `id` (credential id), `username`, and `userId` (user id).
- Signed and verified with HS256; other algorithms are rejected.
- Tokens expire after 2 hours.
- `JWT_SECRET` must be at least 32 characters; the server refuses to
  start with a shorter secret.
- Every query is scoped to `userId` from the token. Requests for data
  you do not own return 404, the same as data that does not exist.
  `GET /api/user/:id` and `GET /api/networth/:userId` return 404 when
  the path id differs from the token's `userId`.
- Registration writes the user and credential rows in one transaction.
  Login failures share one generic 401 message, and an unknown username
  costs the same bcrypt comparison as a wrong password.

### Route split

`publicAuthRouter` (`/api/public/`: register, login) runs without a
token. `/api` verifies the token before `authRouter` (`/api/auth/`) and
every resource router, so protected handlers always have `req.user`.

## Status Codes

| Code | Meaning |
|------|---------|
| 400 | Validation failure or malformed id |
| 401 | Missing or invalid token, or failed login |
| 404 | Not found, or not owned by the caller |
| 409 | Duplicate username on register |
| 500 | Unexpected error |

## Validation

Request bodies are checked by zod schemas in `src/validation/` before a
controller runs.

- Schemas are strict: an unknown key returns 400 and no query runs.
- `_id` and `userId` are accepted and ignored. The path `:id` is the
  only target id, and `user_id` always comes from the token.
- Column names come from a fixed per-table map, never from request keys.
- Path ids must be UUIDs; anything else returns 400.
- Numbers are finite, non-negative, and fit NUMERIC(12,2). Dates are
  `YYYY-MM-DD` strings.
- Register requires `username`, `email`, `plainTextPassword` (8 to 72
  characters), and `userData` with `totalAmount` and `totalAllotment`.
  `totalAmount` is stored as 0.
- An update body needs at least one field to change.

## Environment Variables

Create a `.env` file in this package root:

```env
MONGO_USER=<atlas_username>
MONGO_PWD=<atlas_password>
MONGO_CLUSTER=<cluster_hostname>
DB_NAME=<database_name>
JWT_SECRET=<your_secret_key>
USERS_COLLECTION_NAME=users
CREDS_COLLECTION_NAME=user_credentials
CATEGORIES_COLLECTION_NAME=categories
CHARGES_COLLECTION_NAME=charges
STATIC_DIR=public
PORT=3000
```

## Scripts

```bash
npm run dev        # Start in development mode (nodemon + auto-restart)
npm run build      # Compile TypeScript to dist/
npm run start      # Build + start production server
npm run test       # Run all tests once
npm run test:watch # Run tests in watch mode
```

## Testing

The test suite uses Vitest with Supertest for HTTP-level integration testing. MongoDB is fully mocked — no database connection needed to run tests.

```bash
npm run test
```

All tests cover:

- auth middleware and token hardening
- registration (transaction, 409) and login
- request validation and injection rejection
- cross-user access (404)
- charge, category (including cascade deletion), and net worth CRUD
- the summary aggregation pipeline

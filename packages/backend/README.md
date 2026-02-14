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
│   └── auth.middleware.ts    # JWT Bearer token verification
├── controllers/
│   ├── credential.controller.ts   # Register, login, getUserId handlers
│   ├── charge.controller.ts       # Charge CRUD handlers
│   ├── category.controller.ts     # Category CRUD handlers
│   └── summary.controller.ts      # Dashboard summary handler
├── services/
│   ├── base.service.ts            # Generic CRUD base class
│   ├── credential.service.ts      # Auth logic (bcrypt, JWT generation)
│   ├── charge.service.ts          # Charge operations
│   ├── category.service.ts        # Category ops + cascade delete
│   └── summary.service.ts         # Multi-step aggregation pipeline
├── routes/
│   ├── credential.route.ts        # POST /login, /register, GET /userId
│   ├── charge.route.ts            # PATCH/DELETE /:id, PUT /new
│   ├── category.route.ts          # PATCH/DELETE /:id, PUT /new
│   └── summary.route.ts           # GET /:id
├── types/                   # TypeScript interfaces for MongoDB documents
├── shared/                  # Route constants
├── common/                  # Mock data for development
└── __tests__/               # Vitest integration tests (41 tests)
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

All 41 tests cover: auth middleware, credential routes, charge CRUD, category CRUD (including cascade deletion), and the summary aggregation pipeline.

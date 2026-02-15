# BudgetTracker — MongoDB to PostgreSQL Migration Requirements

## What This Is

A budget tracking web application with an Express/TypeScript backend and React 19 frontend, organized as an npm workspaces monorepo. This milestone migrates the backend data layer from MongoDB Atlas (native driver) to a local PostgreSQL database while keeping all API contracts identical so the frontend works without modification.

## Core Value

The database migration must be invisible to the frontend — every route, request shape, and response shape stays identical. Only the backend data layer changes.

## Existing Capabilities (Validated)

- JWT-based authentication with login/logout
- User CRUD with credential management
- Category management with budget amounts and allotments
- Charge tracking linked to categories
- Net worth entry tracking
- Summary/dashboard aggregation endpoint
- Cascade deletion (categories -> charges)
- 53 Vitest integration tests with full CRUD coverage
- React 19 frontend with React Router

## Active Migration Requirements

### Database Foundation (Phase 1)
- **DB-01**: PostgreSQL connection pool module replaces MongoDB singleton, using pg.Pool with configurable pool size
- **DB-02**: Connection module reads DATABASE_URL or individual PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE from .env
- **DB-03**: SQL schema defines users table (id UUID PK, name, email, total_amount, total_allotment)
- **DB-04**: SQL schema defines user_credentials table (id UUID PK, username UNIQUE, email, hashed_password, user_id FK -> users)
- **DB-05**: SQL schema defines categories table (id UUID PK, user_id FK -> users, title, amount, allotment)
- **DB-06**: SQL schema defines charges table (id UUID PK, user_id FK -> users, category_id FK -> categories ON DELETE CASCADE, description, amount, date)
- **DB-07**: SQL schema defines networth table (id UUID PK, user_id FK -> users, name, type, value, description, date)
- **DB-08**: Migration script lives in db/migrations/ and can create all tables from scratch

### Type System (Phase 2)
- **TYPE-01**: All document/entity interfaces use UUID string instead of MongoDB ObjectId for id fields
- **TYPE-02**: All service methods accept and return UUID strings instead of ObjectId
- **TYPE-03**: Application compiles with zero TypeScript errors after type changes

### Service Layer — Base (Phase 3)
- **SVC-01**: BaseService<T> uses SQL queries (INSERT, SELECT, UPDATE, DELETE) with parameterized queries instead of MongoDB operations
- **SVC-02**: BaseService<T> generates UUIDs for new records using crypto.randomUUID()
- **SVC-03**: BaseService<T> maps PostgreSQL row results to typed objects matching existing response shapes

### Service Layer — Domain Services (Phases 4-5)
- **SVC-04**: CredentialService uses SQL for login validation, credential creation, and user lookup
- **SVC-05**: CategoryService uses SQL for CRUD operations on categories
- **SVC-06**: ChargeService uses SQL for CRUD operations on charges
- **SVC-07**: NetWorthService uses SQL for CRUD operations on net worth entries
- **SVC-08**: Category deletion cascades to associated charges via ON DELETE CASCADE foreign key constraint

### Service Layer — Summary Aggregation (Phase 6)
- **SVC-09**: SummaryService replaces MongoDB aggregation pipeline with SQL JOINs and GROUP BY
- **SVC-10**: Summary endpoint returns identical JSON response shape as MongoDB version
- **SVC-11**: Multi-step summary operations use PostgreSQL transactions for consistency

### Configuration (Phases 4, 7)
- **CFG-01**: .env template removes MONGO_USER, MONGO_PWD, MONGO_CLUSTER variables
- **CFG-02**: .env template adds PG_HOST=localhost, PG_PORT=5432, PG_USER, PG_PASSWORD, PG_DATABASE=budgettracker
- **CFG-03**: .env template retains JWT_SECRET and collection/table name variables
- **CFG-04**: src/index.ts connects to PostgreSQL via connection pool instead of MongoDB on startup
- **CFG-05**: Graceful shutdown closes PostgreSQL connection pool

### Testing (Phase 8)
- **TEST-01**: All Vitest test files mock pg Pool/Client instead of MongoClient
- **TEST-02**: Test mocks return PostgreSQL-shaped results ({ rows: [...], rowCount: N })
- **TEST-03**: All 53 existing tests pass with equivalent assertions
- **TEST-04**: Test coverage remains equivalent (same CRUD operations and edge cases covered)

### Verification (Phase 9)
- **VER-01**: All API routes return identical response shapes as before migration
- **VER-02**: Application compiles with zero TypeScript errors (tsc --noEmit passes)
- **VER-03**: All 53 Vitest tests pass
- **VER-04**: MongoDB dependencies (mongodb package) removed from package.json

## Out of Scope

| Feature | Reason |
|---------|--------|
| Frontend changes | API contracts unchanged, React app untouched |
| ORM adoption (Prisma/TypeORM) | Raw pg driver maintains similar abstraction to current MongoDB driver |
| Data migration scripts | No production data to migrate, fresh schema |
| Database hosting/deployment | Local PostgreSQL only for now |
| New fields or tables | Functional parity only, no schema enhancements |
| Docker/containerization | Local PostgreSQL assumed already installed |
| Query builder libraries | BaseService<T> pattern maps well to raw SQL |

## Architecture Context

- Backend follows a layered MVC pattern: Routes -> Controllers -> Services -> Database
- BaseService<T> is a generic CRUD class that all domain services extend
- MongoDB connection is a singleton in `packages/backend/src/mongo.database.ts`
- Summary endpoint uses multi-step MongoDB aggregation pipeline to join users, categories, and charges
- All tests mock the MongoDB client at the module level using Vitest's `vi.mock()`
- Collection name environment variables (USERS_COLLECTION_NAME, etc.) are used throughout
- Monorepo structure: `packages/backend/` and `packages/frontend/`

## Constraints

- **API parity**: All routes and response shapes must remain identical — frontend has zero changes
- **Tech stack**: Use `pg` (node-postgres) native driver, not an ORM
- **ID format**: Switch from MongoDB ObjectId to UUID (crypto.randomUUID())
- **Testing**: All 53 existing tests must pass after migration with equivalent mocking strategy
- **TypeScript**: Zero compilation errors after migration

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Use pg driver instead of Prisma/TypeORM | Maintains similar abstraction level to MongoDB native driver; BaseService<T> maps well to raw SQL |
| UUID primary keys instead of auto-increment | Matches existing ObjectId pattern (generated in app, not DB); no sequential ID exposure |
| Keep collection/table name env vars | Preserves existing configuration pattern; minimal config change |
| Support both DATABASE_URL and individual PG_* vars | Flexibility for different deployment environments |
| snake_case in SQL, camelCase in TypeScript | Follow conventions of each layer, map at service boundary |
| PostgreSQL transactions for summary | ACID guarantees replace MongoDB's eventually consistent bulkWrite |

## Technology Stack

**Install:**
- pg (^8.13.1) - PostgreSQL client for Node.js
- @types/pg - TypeScript definitions

**Use (built-in):**
- crypto.randomUUID() - UUID generation (Node.js built-in, no extra dependency)

**Remove (Phase 9):**
- mongodb package
- mongoose package (unused)
- mongo package (unused)

## Requirement Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 through DB-08 | Phase 1 | Pending |
| TYPE-01 through TYPE-03 | Phase 2 | Pending |
| SVC-01 through SVC-03 | Phase 3 | Pending |
| SVC-04, CFG-01 through CFG-03 | Phase 4 | Pending |
| SVC-05 through SVC-08 | Phase 5 | Pending |
| SVC-09 through SVC-11 | Phase 6 | Pending |
| CFG-04, CFG-05 | Phase 7 | Pending |
| TEST-01 through TEST-04 | Phase 8 | Pending |
| VER-01 through VER-04 | Phase 9 | Pending |

**Coverage:** 35 v1 requirements, all mapped to phases, 0 unmapped.

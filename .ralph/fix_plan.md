# MongoDB to PostgreSQL Migration — Fix Plan

## Phase 1: Database Foundation ✅
**Goal**: PostgreSQL database with complete schema ready for application layer

- [x] Install pg and @types/pg dependencies in packages/backend
- [x] Create `packages/backend/src/postgres.database.ts` with pg.Pool connection pool
- [x] Export `pool` and `connectPostgres()` and `closePostgres()` functions
- [x] Create `packages/backend/db/migrations/001_create_schema.sql` with all 5 tables
- [x] Add foreign key constraints enforcing referential integrity

## Phase 2: Type System Migration ✅
**Goal**: All TypeScript types use UUID instead of ObjectId

- [x] Update all 5 type files — ObjectId replaced with string, _id kept for frontend API compat
- [x] summary.type.ts unchanged (references other types)

## Phase 3: Base Service Abstraction ✅
**Goal**: Generic CRUD foundation using SQL queries

- [x] Rewrite base.service.ts with pg.Pool, parameterized SQL, crypto.randomUUID()
- [x] Implement create(), findById(), updateById(), deleteById() with snake_case<->camelCase mapping
- [x] Export rowToDoc() helper for snake_case -> camelCase + id -> _id mapping

## Phase 4: Authentication Service ✅
**Goal**: User authentication works with PostgreSQL

- [x] Rewrite credential.service.ts — registerUser, verifyPassword, getUserId
- [x] Update .env with PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE

## Phase 5: Simple Domain Services ✅
**Goal**: Category, charge, net worth CRUD with cascade deletion

- [x] Rewrite category.service.ts — ON DELETE CASCADE handles charge cleanup
- [x] Rewrite charge.service.ts — direct pg.Pool queries
- [x] Rewrite netWorth.service.ts — extends BaseService + findByUserId with SQL

## Phase 6: Summary Aggregation Service ✅
**Goal**: Complex multi-table aggregations with identical API responses

- [x] Rewrite summary.service.ts with PostgreSQL transactions (BEGIN/COMMIT/ROLLBACK)
- [x] UPDATE categories using LEFT JOIN + COALESCE for zero-charge handling
- [x] UPDATE users total_amount from SUM of categories
- [x] Credential lookup for userCred field mapping

## Phase 7: Application Integration ✅
**Goal**: Backend server connects to PostgreSQL

- [x] Update index.ts — import from postgres.database.ts, graceful shutdown
- [x] Update all 5 controllers — import pool from postgres.database

## Phase 8: Test Suite Migration ✅
**Goal**: All tests pass with PostgreSQL mocks

- [x] Rewrite all 6 test files to mock postgres.database with pg Pool query
- [x] Summary tests mock pool.connect() for transaction testing
- [x] All 52 tests passing

## Phase 9: End-to-End Verification ✅
**Goal**: Complete application works with PostgreSQL, MongoDB removed

- [x] `npx tsc --noEmit` — zero TypeScript errors
- [x] `npx vitest run` — all 52 tests pass
- [x] mongodb package already absent from package.json (replaced by pg)
- [x] Delete `packages/backend/src/mongo.database.ts`
- [x] No functional MongoDB imports remain (zero `import.*from.*mongodb`)
- [x] vitest.config.ts updated — MONGO_* removed, PG_* added
- [x] .env updated with PostgreSQL variables, MONGO_* removed

## Completed
- [x] All 9 phases complete
- [x] Frontend untouched (zero modifications to packages/frontend/)
- [x] API contracts preserved (_id field name, same response shapes)
- [x] 52 tests passing, zero TypeScript errors

# BudgetTracker — MongoDB to PostgreSQL Migration

## What This Is

A budget tracking web application with an Express/TypeScript backend and React 19 frontend, organized as an npm workspaces monorepo. This milestone migrates the backend data layer from MongoDB Atlas (native driver) to a local PostgreSQL database while keeping all API contracts identical so the frontend works without modification.

## Core Value

The database migration must be invisible to the frontend — every route, request shape, and response shape stays identical. Only the backend data layer changes.

## Requirements

### Validated

<!-- Existing capabilities inferred from codebase -->

- ✓ JWT-based authentication with login/logout — existing
- ✓ User CRUD with credential management — existing
- ✓ Category management with budget amounts and allotments — existing
- ✓ Charge tracking linked to categories — existing
- ✓ Net worth entry tracking — existing
- ✓ Summary/dashboard aggregation endpoint — existing
- ✓ Cascade deletion (categories → charges) — existing
- ✓ 53 Vitest integration tests with full CRUD coverage — existing
- ✓ React 19 frontend with React Router — existing

### Active

<!-- Migration scope — building toward these -->

- [ ] Install PostgreSQL dependencies (pg, @types/pg)
- [ ] Replace MongoDB connection singleton with PostgreSQL connection pool
- [ ] Create SQL schema for all 5 tables with UUID primary keys and foreign key constraints
- [ ] Rewrite BaseService<T> to use SQL queries (INSERT/UPDATE/DELETE/SELECT)
- [ ] Rewrite all domain services to use SQL instead of MongoDB operations
- [ ] Replace MongoDB aggregation pipeline in summary.service.ts with SQL JOINs and GROUP BY
- [ ] Maintain cascade deletion behavior (categories → charges via ON DELETE CASCADE)
- [ ] Update .env template to use PG_* variables instead of MONGO_* variables
- [ ] Update all 53 Vitest tests to mock pg Pool/Client instead of MongoClient
- [ ] Replace MongoDB ObjectId references with UUID strings in all types
- [ ] Add db/migrations/ folder with SQL schema creation script
- [ ] Update src/index.ts to connect to PostgreSQL on startup
- [ ] All tests pass and app compiles with zero TypeScript errors

### Out of Scope

- Frontend changes — API contracts are unchanged, React app is untouched
- ORM adoption (Prisma/TypeORM) — using raw pg driver to keep the migration simple and maintain similar abstraction level
- Data migration scripts — no production data to migrate, this is a fresh schema
- Database hosting/deployment — local PostgreSQL only for now
- Schema changes beyond what MongoDB collections already store — no new fields or tables
- Performance optimization — functional parity first

## Context

- Backend follows a layered MVC pattern: Routes → Controllers → Services → Database
- BaseService<T> is a generic CRUD class that all domain services extend
- MongoDB connection is a singleton in `packages/backend/src/mongo.database.ts`
- Summary endpoint uses multi-step MongoDB aggregation pipeline to join users, categories, and charges
- All tests mock the MongoDB client at the module level using Vitest's `vi.mock()`
- Collection name environment variables (USERS_COLLECTION_NAME, etc.) are used throughout
- Monorepo structure: `packages/backend/` and `packages/frontend/`

## Constraints

- **API parity**: All routes and response shapes must remain identical — frontend has zero changes
- **Tech stack**: Use `pg` (node-postgres) native driver, not an ORM — keeps similar abstraction level to current MongoDB driver usage
- **ID format**: Switch from MongoDB ObjectId to UUID (crypto.randomUUID or uuid package)
- **Testing**: All 53 existing tests must pass after migration with equivalent mocking strategy
- **TypeScript**: Zero compilation errors after migration

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use pg driver instead of Prisma/TypeORM | Maintains similar abstraction level to MongoDB native driver; simpler migration path; BaseService<T> pattern maps well to raw SQL | — Pending |
| UUID primary keys instead of auto-increment | Matches existing ObjectId pattern (generated in app, not DB); no sequential ID exposure | — Pending |
| Keep collection/table name env vars | Preserves existing configuration pattern; minimal config change | — Pending |
| Support both DATABASE_URL and individual PG_* vars | Flexibility for different deployment environments | — Pending |

---
*Last updated: 2026-02-14 after initialization*

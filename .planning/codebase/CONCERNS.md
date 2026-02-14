# Codebase Concerns

**Analysis Date:** 2026-02-14

## Tech Debt

**Duplicate MongoDB dependencies:**
- Issue: Root `package.json` includes both `mongodb`, `mongo`, and `mongoose` packages, but only `mongodb` is actually used
- Files: `/Users/theaccount/projects/personal/BudgetTracker/package.json`
- Impact: Unnecessary dependencies increase bundle size and create confusion about which MongoDB driver is used
- Fix approach: Remove `mongo` and `mongoose` from root dependencies, keep only `mongodb`

**Inconsistent error handling patterns:**
- Issue: Services use try-catch with console.error and boolean returns, while controllers use try-catch with next(err)
- Files:
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/charge.service.ts` (lines 55-57, 80-82, 98-100)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/netWorth.service.ts` (lines 40-41, 57-58, 72-73, 89-91)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/controllers/credential.controller.ts`
- Impact: Errors are swallowed in services with only console.error, making debugging and monitoring difficult
- Fix approach: Throw errors from services and let controllers handle HTTP responses, implement proper error logging strategy

**Debug console.log statements in production code:**
- Issue: Multiple console.log statements left in production code for debugging MongoDB connection
- Files:
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/mongo.database.ts` (lines 33-37, 45, 70)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/index.ts` (line 17, 28, 30, 33, 38)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/credential.service.ts` (line 103)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/controllers/category.controller.ts` (line 38)
- Impact: Clutters logs and potentially exposes sensitive information; line 103 logs plaintext password
- Fix approach: Remove debug statements, implement proper structured logging library

**Unsafe `any` type assertions:**
- Issue: Multiple MongoDB query filters use `as any` to bypass TypeScript checks
- Files:
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/base.service.ts` (lines 62, 73, 85)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/netWorth.service.ts` (lines 87-88)
- Impact: Defeats TypeScript's type safety, can hide bugs at compile time
- Fix approach: Define proper filter types or use MongoDB's FilterQuery helper types

**Incomplete TODO in abandoned code:**
- Issue: TODO comment for form submission handler in orphaned file
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/todo/NetWorthFormPage.tsx` (line 11)
- Impact: Dead code with unfinished functionality suggests incomplete feature migration
- Fix approach: Delete `todo/` directory if features are complete in `src/pages/`, or finish migration

**Hardcoded port fallback:**
- Issue: Backend server defaults to port 3000 without environment variable validation
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/index.ts` (line 23)
- Impact: May conflict with other services or cause silent failures in production if PORT isn't set
- Fix approach: Make PORT required in env validation or document the default clearly

**Environment variable scattered validation:**
- Issue: Each service validates its own env vars at instantiation rather than centralized validation
- Files:
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/mongo.database.ts` (lines 26-44)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/credential.service.ts` (lines 63-68)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/summary.service.ts` (lines 29-35)
- Impact: Application may partially start before failing, unclear which env vars are required overall
- Fix approach: Create central env validation module that runs at startup and fails fast

**URL encoding inconsistency:**
- Issue: MongoDB credentials are URL-encoded but then not used in the connection string
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/mongo.database.ts` (lines 47-54)
- Impact: Variables are encoded (lines 48-51) but raw values are used (line 54), breaking connections with special characters
- Fix approach: Use encoded variables in connection string: `mongodb+srv://${userEnc}:${pwdEnc}@${clusterEnc}/${dbEnc}`

## Known Bugs

**Password exposure in logs:**
- Symptoms: Plaintext passwords written to console during user registration
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/credential.service.ts` (line 103)
- Trigger: Any user registration via POST /auth/register
- Workaround: Remove or redact console.log statement immediately

**Silent error handling in API clients:**
- Symptoms: Frontend API errors are caught and logged but not surfaced to user
- Files:
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src/api/charges.ts` (lines 36-38, 65-67)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src/api/categories.ts` (lines 36, 64)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src/api/credentials.ts` (lines 42, 78, 101)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src/api/networth.ts` (lines 28, 59, 90)
- Trigger: Any failed API request
- Workaround: Check browser console; errors aren't shown in UI

**Empty array returns on error:**
- Symptoms: NetWorth service returns empty array on database errors, indistinguishable from "no data"
- Files:
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/netWorth.service.ts` (line 91)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src/api/networth.ts` (line 29)
- Trigger: Database query failure in getAllNetWorthByUserId
- Workaround: None; errors are invisible to client

## Security Considerations

**Plaintext password logging:**
- Risk: Passwords written to application logs during registration
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/credential.service.ts` (line 103)
- Current mitigation: None
- Recommendations: Remove immediately; implement log sanitization to prevent accidental credential exposure

**JWT stored in localStorage:**
- Risk: Vulnerable to XSS attacks; tokens accessible to any JavaScript on the page
- Files:
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src/pages/RegisterFormPage.tsx` (line 44)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src/pages/LoginFormPage.tsx` (line 40)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src/api/auth.ts` (lines 18, 31)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src/App.tsx` (line 55)
- Current mitigation: None
- Recommendations: Consider httpOnly cookies with SameSite=Strict, or implement CSRF protection if staying with localStorage

**No input validation/sanitization:**
- Risk: Unvalidated user input passed directly to MongoDB queries and JWT payloads
- Files:
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/controllers/credential.controller.ts` (lines 35-40)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/charge.service.ts`
- Current mitigation: MongoDB driver handles some query injection, but no application-level validation
- Recommendations: Add validation middleware (joi, zod, or express-validator); sanitize inputs before database operations

**JWT secret from process.env without validation:**
- Risk: Application starts with undefined or weak JWT_SECRET
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/middleware/auth.middleware.ts` (line 57)
- Current mitigation: None at startup; will fail at first auth attempt
- Recommendations: Validate JWT_SECRET exists and meets minimum entropy requirements at startup

**.env file committed to repository:**
- Risk: .env file exists in backend directory and may contain secrets
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/.env`
- Current mitigation: Root .gitignore includes `.env` pattern
- Recommendations: Verify .env is not tracked in git; rotate any exposed secrets; use .env.example template instead

**No rate limiting:**
- Risk: Authentication endpoints vulnerable to brute force attacks
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/controllers/credential.controller.ts`
- Current mitigation: None
- Recommendations: Implement rate limiting middleware (express-rate-limit) on /auth/login and /auth/register

**CORS configuration not visible:**
- Risk: Unclear if CORS is properly configured; may be too permissive
- Files: Not found in explored files
- Current mitigation: Unknown
- Recommendations: Audit app.ts/index.ts for CORS middleware; restrict origins to production domains

## Performance Bottlenecks

**N+1 query pattern in summary aggregation:**
- Problem: Summary service performs multiple sequential database operations
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/summary.service.ts` (lines 64-80)
- Cause: Separate aggregation, find, and bulkWrite operations instead of single pipeline
- Improvement path: Refactor to single aggregation pipeline with $lookup stages to reduce round trips

**Missing database indexes:**
- Problem: No evidence of index definitions for frequently queried fields
- Files: Indexes not defined in codebase; relying on MongoDB defaults
- Cause: No index management in application or migration scripts
- Improvement path: Add indexes on `userId` in charges/categories/netWorth collections, `username` in credentials, `userCred` in users

**Full collection scans on user lookups:**
- Problem: User queries by userId without guaranteed index
- Files:
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/netWorth.service.ts` (line 87)
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/summary.service.ts`
- Cause: Missing compound indexes on userId + other query fields
- Improvement path: Create compound indexes for common query patterns

**Category bulkWrite on every summary fetch:**
- Problem: Every summary request updates all category amounts even if unchanged
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/summary.service.ts` (lines 79-95)
- Cause: No caching or incremental update strategy
- Improvement path: Cache summary data with TTL, or update amounts only when charges change via triggers/hooks

## Fragile Areas

**MongoDB connection URI construction:**
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/mongo.database.ts` (lines 47-54)
- Why fragile: URL-encoded variables created but not used; special characters in password will break connection
- Safe modification: Always use encoded variables; add connection string validation before MongoClient instantiation
- Test coverage: No tests for connection logic

**Authentication middleware error handling:**
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/middleware/auth.middleware.ts` (lines 44-68)
- Why fragile: Callback-based jwt.verify without promise wrapper; easy to introduce unhandled errors
- Safe modification: Wrap in try-catch; use jwt.verify synchronous API; add tests for expired/malformed tokens
- Test coverage: Basic tests exist at `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/__tests__/auth.middleware.test.ts` (99 lines)

**Frontend auth expiration handling:**
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src/api/auth.ts` (lines 30-33, 54-56)
- Why fragile: Custom window event for session expiration; App.tsx must listen or users get stuck
- Safe modification: Test auth:expired event handling; ensure all auth routes clear localStorage consistently
- Test coverage: None (no frontend tests found)

**Summary service multi-step transaction:**
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/summary.service.ts` (lines 54-120)
- Why fragile: Multiple database operations without transaction wrapper; partial failure leaves inconsistent state
- Safe modification: Wrap in MongoDB transaction; add rollback logic; validate state before returning
- Test coverage: Tests at `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/__tests__/summary.routes.test.ts` (310 lines) - check if they cover failure scenarios

**ObjectId string conversion scattered throughout:**
- Files: All services that handle ID parameters
- Why fragile: `new ObjectId(stringId)` throws if invalid; inconsistent error handling across services
- Safe modification: Centralize ObjectId validation; use BaseService.toObjectId helper; return 400 for invalid IDs
- Test coverage: Base service has try-catch (line 39-43) but no validation tests found

## Scaling Limits

**Singleton MongoDB connection:**
- Current capacity: Single connection shared across all requests
- Limit: Will exhaust under high concurrent load
- Scaling path: Use connection pooling; MongoClient already pools internally but pool size not configured

**In-memory summary recalculation:**
- Current capacity: Summary built on every request via aggregation
- Limit: Slow for users with thousands of charges/categories
- Scaling path: Implement materialized view pattern; update summary incrementally on charge CRUD; add Redis cache

**No pagination in list endpoints:**
- Current capacity: getAllNetWorthByUserId returns all documents
- Limit: Memory exhaustion for users with large datasets
- Scaling path: Add limit/offset or cursor-based pagination to all list endpoints

## Dependencies at Risk

**bcrypt v6.0.0:**
- Risk: Version 6.0.0 is very new (released recently); may have compatibility issues
- Impact: Authentication breaks if bcrypt has bugs or incompatibilities
- Migration plan: Pin to stable 5.x.x version or thoroughly test 6.x in staging

**Express 4 vs 5 mismatch:**
- Risk: Root package.json specifies `express@^5.1.0` but backend uses `express@^4.21.2`
- Impact: Workspace dependency resolution confusion; potential runtime errors
- Migration plan: Standardize on Express 4 across monorepo (Express 5 still in beta)

## Missing Critical Features

**No database migration system:**
- Problem: No mechanism to version or manage schema changes
- Blocks: Adding indexes, changing field types, or data migrations requires manual intervention
- Recommendation: Implement migrate-mongo or similar for index/schema management

**No structured logging:**
- Problem: Only console.log/error throughout; no request correlation, log levels, or structured output
- Blocks: Production debugging, log aggregation, monitoring
- Recommendation: Add winston or pino with request ID middleware

**No health check endpoints:**
- Problem: No /health or /ready endpoints to verify service status
- Blocks: Container orchestration, load balancer health checks
- Recommendation: Add GET /health that checks MongoDB connectivity

**No API documentation:**
- Problem: No OpenAPI/Swagger spec; only code comments
- Blocks: Frontend-backend contract validation, client generation
- Recommendation: Add swagger-jsdoc or generate OpenAPI spec from routes

## Test Coverage Gaps

**No frontend tests:**
- What's not tested: All React components, hooks, and API clients
- Files: Entire `/Users/theaccount/projects/personal/BudgetTracker/packages/frontend/src` directory
- Risk: UI regressions undetected; refactoring breaks functionality silently
- Priority: High - at minimum add tests for auth flow and API error handling

**Service layer error paths:**
- What's not tested: Error handling in try-catch blocks (services return false but tests may not verify)
- Files:
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/charge.service.ts`
  - `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/netWorth.service.ts`
- Risk: Errors swallowed; failures return success indicators
- Priority: Medium - add tests that trigger database errors and verify behavior

**Integration tests for authentication flow:**
- What's not tested: End-to-end registration → login → authenticated request flow
- Files: Tests exist separately but not chained flow
- Risk: Token generation/verification mismatch could break auth
- Priority: High - critical user path

**MongoDB connection failure scenarios:**
- What's not tested: Behavior when MongoDB is unavailable at startup or during requests
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/mongo.database.ts`
- Risk: Application hangs or crashes ungracefully
- Priority: Medium - add retry logic and graceful degradation

**Edge cases in summary aggregation:**
- What's not tested: Users with zero categories, duplicate charge IDs, concurrent updates
- Files: `/Users/theaccount/projects/personal/BudgetTracker/packages/backend/src/services/summary.service.ts`
- Risk: Inconsistent state or runtime errors on edge cases
- Priority: Medium - complex business logic needs comprehensive coverage

---

*Concerns audit: 2026-02-14*

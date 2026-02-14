# Net Worth Feature — Fix Plan

## Phase 1: Backend Foundation
- [x] Create netWorth backend type (packages/backend/src/types/netWorth.type.ts) with fields: _id?: ObjectId, userId: ObjectId, name: string, type: string (asset or liability), value: number, description: string, date: Date
- [x] Add NETWORTH_COLLECTION_NAME=networth to packages/backend/.env and NETWORTH_COLLECTION_NAME: "networth" to vitest.config.ts env section
- [x] Create netWorth.service.ts (packages/backend/src/services/netWorth.service.ts) extending BaseService with createNetWorth, updateNetWorth, deleteNetWorth, findByUserId methods

## Phase 2: Backend API
- [x] Create netWorth.controller.ts (packages/backend/src/controllers/netWorth.controller.ts) with CRUD handlers: getNetWorthByUserId, addNetWorth, updateNetWorthById, removeNetWorthById — follow charge.controller.ts pattern exactly
- [x] Create netWorth.route.ts (packages/backend/src/routes/netWorth.route.ts) with GET /:userId, PUT /new, PATCH /:id, DELETE /:id
- [x] Add NETWORTH: "/api/networth/" to ValidStaticRoutes in packages/backend/src/shared/staticRoutes.share.ts
- [x] Register net worth route in packages/backend/src/app.ts: import netWorthRouter and app.use(ValidStaticRoutes.NETWORTH, netWorthRouter) after verifyAuthToken

## Phase 3: Frontend
- [x] Create frontend netWorth type (packages/frontend/src/types/netWorthType.ts) matching backend but with string IDs
- [x] Create api/networth.ts (packages/frontend/src/api/networth.ts) with getNetWorth, addNetWorth, updateNetWorth, deleteNetWorth functions following charges.ts pattern
- [x] Move packages/frontend/todo/net-worth.css to packages/frontend/src/css/net-worth.css
- [x] Create NetWorthPage.tsx (packages/frontend/src/pages/NetWorthPage.tsx) showing assets section, liabilities section, and net total (assets minus liabilities) with clickable item tabs
- [x] Create NetWorthFormPage.tsx (packages/frontend/src/pages/NetWorthFormPage.tsx) for adding/editing net worth items with name, type (asset/liability select), value, description, date fields
- [x] Uncomment and wire up net worth routes in App.tsx — import components, uncomment CSS import, replace commented routes with working routes

## Phase 4: Testing & Verification
- [x] Add Vitest integration tests for net worth endpoints (packages/backend/src/__tests__/netWorth.routes.test.ts) following charge.routes.test.ts pattern — test all 4 routes with success, failure, and 401 cases
- [x] Verify all existing tests still pass by running `npx vitest run` from packages/backend

## Completed
- [x] Project enabled for Ralph
- [x] All phases implemented and tests passing (53/53 tests, 6 test files)

## Notes
- The Footer.tsx already has a Link to "/net-worth" — it just needs working routes
- Skeleton files exist in packages/frontend/todo/ — move and enhance them
- Follow the CategoryService pattern (extends BaseService) for the service
- Follow the charge.controller.ts pattern for the controller (singleton service at module level)
- Keep the exact same JSDoc comment style as existing files

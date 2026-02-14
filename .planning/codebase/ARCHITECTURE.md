# Architecture

**Analysis Date:** 2026-02-14

## Pattern Overview

**Overall:** Three-tier monorepo architecture with separated frontend and backend packages

**Key Characteristics:**
- Monorepo structure with npm workspaces managing frontend (React SPA) and backend (Express REST API)
- Client-server separation with JWT-based authentication
- Backend follows layered MVC pattern: Routes → Controllers → Services → Database
- Frontend uses React Router for client-side routing with component-based UI

## Layers

**Presentation Layer (Frontend):**
- Purpose: React SPA for user interaction and UI rendering
- Location: `packages/frontend/src`
- Contains: Pages, components, hooks, API clients, routing logic
- Depends on: Backend REST API endpoints
- Used by: End users via browser

**Routing Layer (Frontend):**
- Purpose: Client-side navigation and authenticated route protection
- Location: `packages/frontend/src/App.tsx`, `packages/frontend/src/main.tsx`
- Contains: React Router configuration, authentication guards, layout wrapper
- Depends on: Authentication state (JWT token in localStorage)
- Used by: All page components

**API Client Layer (Frontend):**
- Purpose: HTTP communication with backend endpoints
- Location: `packages/frontend/src/api`
- Contains: API client modules (`auth.ts`, `credentials.ts`, `categories.ts`, `charges.ts`, `networth.ts`)
- Depends on: `authFetch` wrapper for JWT header injection
- Used by: Hooks and page components

**HTTP Layer (Backend):**
- Purpose: Request routing and middleware orchestration
- Location: `packages/backend/src/app.ts`, `packages/backend/src/routes`
- Contains: Express app configuration, route definitions, middleware chain
- Depends on: Controllers, authentication middleware
- Used by: Frontend API clients via HTTP

**Controller Layer (Backend):**
- Purpose: Request handling and response formatting
- Location: `packages/backend/src/controllers`
- Contains: Route handlers for credentials, categories, charges, summaries, net worth
- Depends on: Service layer for business logic
- Used by: Route modules

**Service Layer (Backend):**
- Purpose: Business logic and data access abstraction
- Location: `packages/backend/src/services`
- Contains: CRUD services extending `BaseService<T>`, domain-specific operations (e.g., cascade deletes)
- Depends on: MongoDB client and collections
- Used by: Controllers

**Data Layer (Backend):**
- Purpose: MongoDB connection and collection access
- Location: `packages/backend/src/mongo.database.ts`
- Contains: MongoClient singleton, connection manager, database instance
- Depends on: MongoDB Atlas (via environment variables)
- Used by: Services

## Data Flow

**Authentication Flow:**

1. User submits credentials via `LoginFormPage` → `POST /api/public/login`
2. Backend `CredentialController` validates username/password against `credentials` collection
3. On success, backend generates JWT token with `{ id, username }` payload
4. Frontend stores token in `localStorage` and sets `token` state in `App`
5. `App` calls `getUserId()` → `GET /api/auth/userId` to resolve credential ID to user ID
6. All subsequent requests use `authFetch()` to inject `Authorization: Bearer <token>` header
7. Backend `verifyAuthToken` middleware validates token and attaches `req.user`

**Dashboard Data Flow:**

1. `App` component calls `useSummary(userId, token)` hook
2. Hook fetches `GET /api/user/:userId` via `authFetch()`
3. Backend `SummaryController` queries multiple collections (users, categories, charges)
4. `SummaryService` aggregates data into single `SummaryDocument` object
5. Frontend receives summary and passes to `UserPage` component
6. User interactions (edit, delete) call respective API endpoints and trigger `refetch()`

**CRUD Flow (Categories/Charges):**

1. User action triggers API call (e.g., `PATCH /api/category/:id`)
2. Route matches in `categoryRouter` → dispatches to `updateCategoryById` controller
3. Controller extracts request body and calls `categoryService.updateCategory(body)`
4. Service validates `_id`, calls `BaseService.updateById()` with MongoDB `$set` operator
5. Controller returns HTTP 201 on success, 404 on failure
6. Frontend calls `refetch()` to reload summary data

**State Management:**
- Frontend uses React hooks (`useState`, `useEffect`) for local component state
- Global auth state managed in `App` component via `token` and `userId` state
- Data fetching state managed by custom hooks (`useSummary`, `useLoadingError`)
- No Redux or external state management library

## Key Abstractions

**BaseService<T>:**
- Purpose: Generic CRUD interface for MongoDB collections
- Examples: `packages/backend/src/services/base.service.ts`
- Pattern: Template pattern — subclasses inherit `create`, `findById`, `updateById`, `deleteById` and add domain logic

**authFetch:**
- Purpose: Authenticated HTTP request wrapper
- Examples: `packages/frontend/src/api/auth.ts`
- Pattern: Interceptor pattern — automatically attaches JWT headers and handles 401 by dispatching `auth:expired` event

**Document Types:**
- Purpose: Shared type definitions for MongoDB documents
- Examples: `UserDocument`, `CategoryDocument`, `ChargeDocument`, `CredentialDocument`
- Pattern: Data Transfer Objects — typed interfaces with `_id: ObjectId` and domain fields

**Route Validation:**
- Purpose: Centralized route path constants
- Examples: `ValidStaticRoutes` in `packages/backend/src/shared/staticRoutes.share.ts`
- Pattern: Constants module — prevents path string duplication across routes and middleware

## Entry Points

**Frontend Entry Point:**
- Location: `packages/frontend/src/main.tsx`
- Triggers: Browser loads `index.html` which includes bundled script
- Responsibilities: Mounts React app into DOM, wraps `App` in `BrowserRouter`

**Backend Entry Point:**
- Location: `packages/backend/src/index.ts`
- Triggers: `npm run dev` (nodemon) or `npm start` (production)
- Responsibilities: Loads `.env`, connects to MongoDB via `connectMongo()`, starts Express server on PORT

**Backend App Configuration:**
- Location: `packages/backend/src/app.ts`
- Triggers: Imported by `index.ts`
- Responsibilities: Configures middleware (JSON parser, static files), mounts routes, applies auth middleware to `/api` prefix

**Root Route Component:**
- Location: `packages/frontend/src/App.tsx`
- Triggers: Rendered by `main.tsx`
- Responsibilities: Authentication state management, conditional routing (login vs. authenticated routes), data fetching orchestration

## Error Handling

**Strategy:** Layered error propagation with HTTP status codes

**Patterns:**
- Backend controllers use try-catch blocks and call `next(err)` for unexpected errors
- Service layer throws errors for invalid inputs (e.g., missing `_id`, invalid ObjectId)
- Frontend `authFetch` intercepts 401 responses and dispatches `auth:expired` event
- Frontend hooks catch fetch errors and set local `error` state
- MongoDB connection failures exit the process with `process.exit(1)`

## Cross-Cutting Concerns

**Logging:** Console-based logging (`console.log`, `console.error`) throughout backend; no structured logging framework

**Validation:** Input validation primarily in service layer (e.g., checking for `_id` presence); no schema validation library (e.g., Zod, Joi)

**Authentication:** JWT-based with middleware applied to all `/api` routes except `/api/public/`; token stored in localStorage on frontend

---

*Architecture analysis: 2026-02-14*

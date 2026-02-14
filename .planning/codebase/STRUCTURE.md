# Codebase Structure

**Analysis Date:** 2026-02-14

## Directory Layout

```
BudgetTracker/
├── packages/
│   ├── frontend/          # React SPA (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── api/       # HTTP client modules
│   │   │   ├── components/# Reusable UI components
│   │   │   ├── context/   # React context providers
│   │   │   ├── css/       # Global stylesheets
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── pages/     # Route-level page components
│   │   │   ├── types/     # TypeScript type definitions
│   │   │   ├── App.tsx    # Root component + routing
│   │   │   └── main.tsx   # React DOM entry point
│   │   ├── public/        # Static assets (images)
│   │   ├── dist/          # Vite build output (gitignored)
│   │   └── index.html     # SPA shell
│   └── backend/           # Express REST API (Node + TypeScript)
│       ├── src/
│       │   ├── __tests__/ # Vitest integration tests
│       │   ├── common/    # Mock data for development
│       │   ├── controllers/# HTTP request handlers
│       │   ├── middleware/# Express middleware (auth)
│       │   ├── routes/    # Express router modules
│       │   ├── services/  # Business logic layer
│       │   ├── shared/    # Shared constants (route paths)
│       │   ├── types/     # TypeScript type definitions
│       │   ├── app.ts     # Express app configuration
│       │   ├── index.ts   # Server entry point
│       │   └── mongo.database.ts # MongoDB connection
│       └── dist/          # TypeScript build output (gitignored)
├── .planning/             # GSD planning documents
│   └── codebase/          # Architecture analysis (this file)
├── .ralph/                # Ralph agent metadata
├── package.json           # Monorepo root config (workspaces)
└── README.md              # Project documentation
```

## Directory Purposes

**packages/frontend/src/api:**
- Purpose: HTTP client functions for backend communication
- Contains: Modules per resource (credentials, categories, charges, networth) + auth wrapper
- Key files: `auth.ts` (authFetch wrapper), `credentials.ts` (login/register)

**packages/frontend/src/components:**
- Purpose: Reusable UI components used across pages
- Contains: Layout wrapper, Header, Footer, DarkMode toggle, CircularProgress indicator
- Key files: `Layout.tsx` (route wrapper with header/footer)

**packages/frontend/src/context:**
- Purpose: React context providers for shared state
- Contains: Loading/error context provider
- Key files: `loadingErrorContext.tsx`

**packages/frontend/src/css:**
- Purpose: Global stylesheets imported by App.tsx
- Contains: Modular CSS files per UI concern (app, nav-menu, forms, net-worth, etc.)
- Key files: `app.css` (global styles), `forms.page.css` (form layouts)

**packages/frontend/src/hooks:**
- Purpose: Custom React hooks for data fetching and utilities
- Contains: Summary fetching, date formatting, progress calculations, slugification
- Key files: `useSummary.ts` (dashboard data hook), `useLoadingError.ts`

**packages/frontend/src/pages:**
- Purpose: Route-level page components rendered by React Router
- Contains: Login, Register, User dashboard, Category detail, Form pages for CRUD
- Key files: `LoginFormPage.tsx`, `UserPage.tsx`, `CategoryFormPage.tsx`, `ChargeFormPage.tsx`

**packages/frontend/src/types:**
- Purpose: TypeScript interfaces for API response shapes
- Contains: Type definitions mirroring backend document types
- Key files: `summaryType.ts`, `categoryType.ts`, `chargeType.ts`, `userType.ts`

**packages/backend/src/__tests__:**
- Purpose: Integration tests using Vitest and Supertest
- Contains: Route tests for credentials, categories; middleware tests for auth
- Key files: `category.routes.test.ts`, `credential.routes.test.ts`, `auth.middleware.test.ts`

**packages/backend/src/common:**
- Purpose: Development mock data
- Contains: Hardcoded sample data for users, categories, charges
- Key files: `mockUserData.ts`, `mockCategories.ts`, `mockCharges.ts`

**packages/backend/src/controllers:**
- Purpose: Express route handlers that validate service responses
- Contains: One controller per resource (credential, category, charge, summary, netWorth)
- Key files: `category.controller.ts`, `credential.controller.ts`, `summary.controller.ts`

**packages/backend/src/middleware:**
- Purpose: Express middleware functions
- Contains: JWT authentication middleware
- Key files: `auth.middleware.ts` (verifyAuthToken function)

**packages/backend/src/routes:**
- Purpose: Express Router instances defining HTTP routes
- Contains: One router per resource with method/path mappings
- Key files: `category.route.ts`, `credential.route.ts`, `charge.route.ts`

**packages/backend/src/services:**
- Purpose: Business logic and MongoDB operations
- Contains: Service classes extending BaseService<T> with CRUD methods
- Key files: `base.service.ts` (generic CRUD), `category.service.ts`, `credential.service.ts`

**packages/backend/src/shared:**
- Purpose: Constants and utilities shared across backend modules
- Contains: API route path constants
- Key files: `staticRoutes.share.ts` (ValidStaticRoutes object)

**packages/backend/src/types:**
- Purpose: TypeScript interfaces for MongoDB documents
- Contains: Type definitions with `_id: ObjectId` for database entities
- Key files: `user.type.ts`, `category.type.ts`, `charge.type.ts`, `credential.type.ts`

## Key File Locations

**Entry Points:**
- `packages/frontend/src/main.tsx`: React app mount point
- `packages/frontend/src/App.tsx`: Root component with routing and auth logic
- `packages/backend/src/index.ts`: Server startup (dotenv, MongoDB connect, listen)
- `packages/backend/src/app.ts`: Express app configuration and route mounting

**Configuration:**
- `package.json`: Monorepo root with workspaces, concurrently scripts
- `packages/frontend/package.json`: Vite, React, TypeScript dependencies
- `packages/backend/package.json`: Express, MongoDB, JWT, Vitest dependencies
- `packages/frontend/vite.config.ts`: Vite build configuration
- `packages/backend/tsconfig.json`: TypeScript compiler settings

**Core Logic:**
- `packages/backend/src/mongo.database.ts`: MongoDB connection singleton
- `packages/backend/src/services/base.service.ts`: Generic CRUD template
- `packages/frontend/src/api/auth.ts`: Authenticated fetch wrapper
- `packages/frontend/src/hooks/useSummary.ts`: Dashboard data fetching hook

**Testing:**
- `packages/backend/src/__tests__/`: Vitest test files
- `packages/backend/vitest.config.ts`: Vitest configuration

## Naming Conventions

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `UserPage.tsx`, `Layout.tsx`)
- TypeScript modules: camelCase with descriptive suffix (e.g., `auth.middleware.ts`, `category.service.ts`)
- Type definitions: camelCase with `Type` suffix on frontend (e.g., `summaryType.ts`), `.type.ts` suffix on backend
- Tests: `*.test.ts` suffix (e.g., `category.routes.test.ts`)
- CSS: kebab-case (e.g., `nav-menu.css`, `link-tab-container.css`)

**Directories:**
- Lowercase plural for collections (e.g., `components/`, `controllers/`, `services/`)
- Lowercase singular for context (e.g., `context/`, `middleware/`)

**Backend Modules:**
- Controllers: `{resource}.controller.ts` with exported async functions
- Services: `{resource}.service.ts` with class extending `BaseService<T>`
- Routes: `{resource}.route.ts` with default export of Express Router

**Frontend Modules:**
- Pages: `{Name}Page.tsx` (e.g., `UserPage`, `CategoryFormPage`)
- Hooks: `use{Name}.ts` (e.g., `useSummary`, `useSlugtify`)
- API clients: `{resource}s.ts` plural (e.g., `categories.ts`, `charges.ts`)

## Where to Add New Code

**New Feature:**
- Primary code:
  - Backend: Create service in `packages/backend/src/services/{resource}.service.ts`, controller in `packages/backend/src/controllers/{resource}.controller.ts`, router in `packages/backend/src/routes/{resource}.route.ts`
  - Frontend: Create API client in `packages/frontend/src/api/{resource}s.ts`, hook in `packages/frontend/src/hooks/use{Name}.ts`, page in `packages/frontend/src/pages/{Name}Page.tsx`
- Tests:
  - Backend: `packages/backend/src/__tests__/{resource}.routes.test.ts`
  - Frontend: No test infrastructure currently

**New Component/Module:**
- Implementation:
  - Reusable UI component: `packages/frontend/src/components/{Name}.tsx`
  - Page component: `packages/frontend/src/pages/{Name}Page.tsx`
  - Backend service: `packages/backend/src/services/{resource}.service.ts`

**Utilities:**
- Shared helpers:
  - Frontend: `packages/frontend/src/hooks/use{Utility}.ts` for React-specific, or `packages/frontend/src/api/` for HTTP utilities
  - Backend: `packages/backend/src/shared/{utility}.share.ts` for cross-module constants

**New API Endpoint:**
1. Define type in `packages/backend/src/types/{resource}.type.ts`
2. Add service method in `packages/backend/src/services/{resource}.service.ts`
3. Add controller function in `packages/backend/src/controllers/{resource}.controller.ts`
4. Add route in `packages/backend/src/routes/{resource}.route.ts`
5. Mount router in `packages/backend/src/app.ts`
6. Add route path constant to `packages/backend/src/shared/staticRoutes.share.ts` if needed
7. Create API client function in `packages/frontend/src/api/{resource}s.ts`

**New Route (Frontend):**
1. Add route definition to `packages/frontend/src/App.tsx` inside `<Routes>` block
2. Create page component in `packages/frontend/src/pages/{Name}Page.tsx`
3. Import and reference in `App.tsx`

## Special Directories

**node_modules:**
- Purpose: npm package dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in `.gitignore`)

**packages/frontend/dist:**
- Purpose: Vite production build output
- Generated: Yes (via `npm run build`)
- Committed: No (in `.gitignore`)

**packages/backend/dist:**
- Purpose: TypeScript compiled JavaScript output
- Generated: Yes (via `npx tsc`)
- Committed: No (in `.gitignore`)

**.planning:**
- Purpose: GSD-generated planning and codebase documentation
- Generated: Yes (by GSD commands)
- Committed: Yes

**.ralph:**
- Purpose: Ralph AI agent configuration and logs
- Generated: Yes (by Ralph)
- Committed: Partial (specs/docs committed, logs ignored)

**packages/frontend/public:**
- Purpose: Static assets served directly by Vite dev server and bundled in production
- Generated: No (manually created)
- Committed: Yes

---

*Structure analysis: 2026-02-14*

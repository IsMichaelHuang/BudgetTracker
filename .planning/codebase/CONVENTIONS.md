# Coding Conventions

**Analysis Date:** 2026-02-14

## Naming Patterns

**Files:**
- TypeScript source files: `camelCase.ts` or `PascalCase.tsx` for React components
- Test files: `*.test.ts` pattern in `__tests__/` directory
- Route files: `*.route.ts` (e.g., `charge.route.ts`)
- Controller files: `*.controller.ts` (e.g., `charge.controller.ts`)
- Service files: `*.service.ts` (e.g., `charge.service.ts`)
- Type definition files: `*.type.ts` (e.g., `charge.type.ts`)
- Middleware files: `*.middleware.ts` (e.g., `auth.middleware.ts`)

**Functions:**
- camelCase for all function names
- Async functions prefixed with action verbs: `updateChargeById`, `createCharge`, `deleteCharge`
- Controller handlers named after action: `register`, `login`, `addCharge`, `removeChargeById`
- React hooks: `use` prefix (e.g., `useSummary`, `useSlugtify`, `useFormatDate`)
- Helper utilities: descriptive verbs (e.g., `getAuthHeaders`, `authFetch`, `verifyAuthToken`)

**Variables:**
- camelCase for all variables
- React state variables: descriptive names (e.g., `token`, `userId`, `summary`, `loading`, `error`)
- Constants: UPPER_SNAKE_CASE for environment-based values (e.g., `STATIC_DIR`, `JWT_SECRET`)
- Collection references: plural nouns (e.g., `chargesCollection`, `categoriesCollection`)

**Types:**
- PascalCase for all TypeScript interfaces and types
- Document types: `*Document` suffix (e.g., `ChargeDocument`, `UserDocument`)
- Frontend types: `*Type` suffix (e.g., `SummaryType`, `ChargeType`, `CategoryType`)
- Props interfaces: `*Props` suffix (e.g., `summaryProps`)
- Interface prefix: Capital `I` for non-exported interfaces (e.g., `IAuthTokenPayLoad`)

## Code Style

**Formatting:**
- No explicit formatter config detected (no .prettierrc)
- Indentation: 4 spaces (observed in backend) and 2 spaces (observed in frontend)
- String literals: Double quotes preferred
- Semicolons: Required at statement ends
- Line length: No enforced limit

**Linting:**
- Frontend: ESLint with TypeScript ESLint plugin
- Config: `packages/frontend/eslint.config.js`
- Rules enforced:
  - React Hooks rules (via `eslint-plugin-react-hooks`)
  - `react-refresh/only-export-components` warning
  - TypeScript recommended rules
- Backend: No ESLint config (relies on TypeScript compiler strictness)

**TypeScript Strictness:**
- Backend: `strict: true`, `noImplicitAny: true` in `packages/backend/tsconfig.json`
- Frontend: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` in `packages/frontend/tsconfig.json`
- Target: ES2023 (backend), ES2020 (frontend)

## Import Organization

**Order:**
1. Node.js built-in modules (e.g., `path`, `express`)
2. External npm packages (e.g., `react`, `mongodb`, `jsonwebtoken`)
3. Type imports with `type` keyword (e.g., `import type { ChargeDocument } from "types/charge.type"`)
4. Internal modules (relative imports)
5. CSS imports (frontend only)

**Example from `packages/backend/src/app.ts`:**
```typescript
import path from "path";
import express, { Request, Response } from "express";
import { ValidStaticRoutes } from "./shared/staticRoutes.share";
import { verifyAuthToken } from "./middleware/auth.middleware";
import credentialRouter from "./routes/credential.route";
```

**Example from `packages/frontend/src/App.tsx`:**
```typescript
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';

import './css/app.css';

import LoginFormPage from './pages/LoginFormPage';
import Layout from './components/Layout';
```

**Path Aliases:**
- Backend uses `baseUrl: "./src"` allowing `types/charge.type` instead of `../types/charge.type`
- Frontend: No path aliases configured

## Error Handling

**Patterns:**
- Controllers use try-catch blocks, delegate errors to Express via `next(err)`
- Services return boolean success indicators instead of throwing
- Service pattern:
  ```typescript
  try {
      // operation
      return true;
  } catch (err) {
      console.error(err);
      return false;
  }
  ```
- Controllers check service return value and send appropriate HTTP status:
  ```typescript
  if (!status) {
      res.status(404).json({error: "Operation failed"})
      return;
  }
  res.status(201).json({message: "Success"})
  ```
- Frontend: Async operations catch errors silently (no re-throw) to prevent unhandled rejections

**Auth Error Handling:**
- `packages/frontend/src/api/auth.ts` implements `authFetch` wrapper
- On 401 response: clears token, dispatches `"auth:expired"` event, throws error
- Root App component listens for event and resets auth state

## Logging

**Framework:** `console` (no dedicated logging library)

**Patterns:**
- Service layer logs errors: `console.error(err)` in catch blocks
- No structured logging or log levels
- No request/response logging middleware

## Comments

**When to Comment:**
- JSDoc comments used extensively on all modules, functions, types
- Every file starts with `@module` and `@description`
- All exported functions have JSDoc with `@param`, `@returns`, `@throws`
- Route handlers document HTTP method and path with `@route`
- Inline comments used sparingly for clarification

**JSDoc/TSDoc:**
- Full JSDoc coverage in backend codebase (`packages/backend/src/`)
- Examples in `packages/backend/src/controllers/charge.controller.ts`
- Frontend uses JSDoc on components and hooks
- Type definitions include descriptive comments for each field

**Example:**
```typescript
/**
 * @module charge.controller
 * @description Express route handlers for charge (expense) CRUD operations.
 * Each handler validates the service response and returns appropriate HTTP status codes.
 * Delegates business logic to {@link ChargeService}.
 */
```

## Function Design

**Size:**
- Controllers: Single responsibility per handler (20-40 lines typical)
- Services: One method per CRUD operation (20-50 lines)
- React components: Vary from 40 (simple) to 170 lines (form pages)

**Parameters:**
- Controllers receive Express standard `(req: Request, res: Response, next: NextFunction)`
- Services receive primitive values or type-safe objects
- React components receive typed props interfaces
- No parameter limit enforced

**Return Values:**
- Controllers: `Promise<void>` (use `res.json()` for responses)
- Services: `Promise<boolean>` for mutation operations
- React hooks: Object with named properties (e.g., `{ summary, loading, error, refetch }`)
- Utility functions: Explicit return types (e.g., `Promise<Response>`, `Promise<string>`)

**Async Pattern:**
```typescript
async function handler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // logic
    } catch (err) {
        next(err);
    }
}
```

## Module Design

**Exports:**
- Named exports preferred for functions: `export async function updateChargeById(...)`
- Default export for routers: `export default chargeRouter`
- Default export for React components: `export default App`
- Services exported as classes: `export class ChargeService`
- Types exported as named: `export interface ChargeDocument`

**Barrel Files:**
- Not used (no index.ts re-exports)
- Direct imports from specific files

**Module Pattern (Backend):**
- Singleton service instances created at module load:
  ```typescript
  const client = mongoClient;
  const chargeService = new ChargeService(client);
  ```
- Routes import and use controller functions
- Controllers import and use service instances

**Module Pattern (Frontend):**
- Components and hooks as independent modules
- Shared utilities in `src/api/` and `src/hooks/`
- Types centralized in `src/types/`

## React Conventions

**Component Structure:**
- Functional components with hooks (no class components)
- Props defined via typed interfaces
- State managed with `useState`
- Side effects with `useEffect`

**State Management:**
- Local state with `useState` and `useEffect`
- Context used minimally (e.g., `loadingErrorContext`)
- Auth state lifted to App component (`token`, `userId`)
- Data fetching encapsulated in custom hooks

**Hooks Pattern:**
```typescript
function useCustomHook(param: string | null) {
    const [data, setData] = useState<DataType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // fetch logic
    }, [param]);

    return { data, loading, error };
}
```

## ObjectId Handling

**Pattern:**
- Backend services convert string IDs to MongoDB ObjectId before database operations
- Frontend sends/receives string representations
- Conversion example:
  ```typescript
  const {userId, categoryId, ...fields} = body;
  const result = await collection.insertOne({
      userId: new ObjectId(userId),
      categoryId: new ObjectId(categoryId),
      ...fields
  });
  ```

---

*Convention analysis: 2026-02-14*

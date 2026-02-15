# Ralph Agent Configuration

## Build Instructions

```bash
# Build backend (TypeScript)
cd packages/backend && npx tsc

# Build frontend
cd packages/frontend && npm run build
```

## Test Instructions

```bash
# Run all backend tests (from packages/backend/)
cd packages/backend && npx vitest run

# Type check (zero errors required)
cd packages/backend && npx tsc --noEmit
```

## Run Instructions

```bash
# Start dev servers (backend + frontend)
npm run dev

# Start backend only
cd packages/backend && npm start
```

## Project Structure
- packages/backend/ — Express + TypeScript backend (migrating from MongoDB to PostgreSQL)
- packages/frontend/ — React 19 + Vite frontend (DO NOT MODIFY)
- .planning/ — PRD, roadmap, requirements, research documents
- Monorepo with npm workspaces (shared package.json at root)

## Notes
- Backend tests use Vitest with supertest
- Environment variables are in packages/backend/.env
- Vitest config is at packages/backend/vitest.config.ts
- Test env vars must be set in vitest.config.ts env section
- The migration target is PostgreSQL using the `pg` native driver
- All API response shapes must remain identical for frontend compatibility

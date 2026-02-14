# Ralph Agent Configuration

## Build Instructions

```bash
# Build frontend
cd packages/frontend && npm run build

# Build backend (TypeScript)
cd packages/backend && npx tsc
```

## Test Instructions

```bash
# Run all backend tests (from packages/backend/)
cd packages/backend && npx vitest run
```

## Run Instructions

```bash
# Start backend server
cd packages/backend && npm start
```

## Project Structure
- packages/backend/ — Express + MongoDB backend
- packages/frontend/ — React + Vite frontend
- Monorepo with shared package.json at root

## Notes
- Backend tests use Vitest with supertest
- Environment variables are in packages/backend/.env
- Vitest config is at packages/backend/vitest.config.ts
- Test env vars must be set in vitest.config.ts env section

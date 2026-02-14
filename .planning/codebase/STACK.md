# Technology Stack

**Analysis Date:** 2026-02-14

## Languages

**Primary:**
- TypeScript 5.7.3 (backend) / 5.8.3 (frontend) - All source code

**Secondary:**
- JavaScript - Configuration files (eslint, vite, vitest configs)

## Runtime

**Environment:**
- Node.js v25.6.1

**Package Manager:**
- npm (workspaces-based monorepo)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Express 5.1.0 (root) / 4.21.2 (backend) - Backend HTTP server
- React 19.1.0 - Frontend UI library
- React Router DOM 7.6.0 - Client-side routing

**Testing:**
- Vitest 4.0.18 - Backend test runner
- Supertest 7.2.2 - HTTP integration testing

**Build/Dev:**
- Vite 6.3.5 - Frontend build tool and dev server
- TypeScript Compiler (tsc) - Backend compilation
- Nodemon 3.1.9 - Backend hot reload in development
- Concurrently 9.2.1 - Parallel dev script execution

## Key Dependencies

**Critical:**
- mongodb 6.17.0 (backend) / 6.16.0 (root) - MongoDB native driver
- jsonwebtoken 9.0.2 - JWT authentication
- bcrypt 6.0.0 - Password hashing
- dotenv 16.4.7 (backend) / 16.5.0 (root) - Environment variable loading

**Infrastructure:**
- @vitejs/plugin-react-swc 3.9.0 - Fast React compilation with SWC
- vite-plugin-checker 0.9.3 - TypeScript checking in Vite dev server

## Configuration

**Environment:**
- Backend uses `.env` file loaded via dotenv
- Required variables:
  - `MONGO_USER` - MongoDB Atlas username
  - `MONGO_PWD` - MongoDB Atlas password
  - `MONGO_CLUSTER` - Atlas cluster hostname
  - `DB_NAME` - Database name
  - `JWT_SECRET` - JWT signing secret
  - `USERS_COLLECTION_NAME` - Users collection name
  - `CREDS_COLLECTION_NAME` - Credentials collection name
  - `CHARGES_COLLECTION_NAME` - Charges collection name
  - `CATEGORIES_COLLECTION_NAME` - Categories collection name
  - `NETWORTH_COLLECTION_NAME` - Net worth collection name
  - `PORT` (optional, defaults to 3000)
  - `STATIC_DIR` (optional, defaults to "public")

**Build:**
- Backend: `packages/backend/tsconfig.json` - Target ES2023, NodeNext modules
- Frontend: `packages/frontend/tsconfig.json` - Target ES2020, bundler mode
- Frontend dev server proxy: `packages/frontend/vite.config.ts` proxies `/api/` and `/auth/` to `localhost:3000`
- Backend build output: `packages/backend/dist/`
- Frontend build output: `packages/frontend/dist/`

## Platform Requirements

**Development:**
- Node.js 25+ (based on installed version)
- npm workspaces support
- MongoDB Atlas connection

**Production:**
- Node.js runtime
- MongoDB Atlas cluster
- Static file serving for frontend build

---

*Stack analysis: 2026-02-14*

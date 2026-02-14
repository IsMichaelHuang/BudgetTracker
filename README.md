# BudgetTracker

A full-stack personal budget tracking application. Create budget categories, log expenses, and monitor spending with visual progress indicators.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router DOM 7, Vite + SWC, TypeScript |
| Backend | Express 4, Node.js, TypeScript |
| Database | MongoDB Atlas (native driver) |
| Auth | bcrypt + JWT (Bearer tokens, 2h expiry) |
| Testing | Vitest + Supertest (41 integration tests) |

## Monorepo Structure

This project uses Yarn workspaces with two packages:

```
BudgetTracker/
├── packages/
│   ├── backend/        # Express REST API + MongoDB
│   └── frontend/       # React SPA
├── package.json        # Root workspace config
└── README.md
```

See each package's README for detailed documentation:
- [Backend README](packages/backend/README.md) — API routes, env vars, services architecture
- [Frontend README](packages/frontend/README.md) — route structure, components, hooks

## Getting Started

### Prerequisites

- Node.js (v18+)
- A MongoDB Atlas cluster

### 1. Install dependencies

```bash
npm install
```

This installs dependencies for both packages via workspaces.

### 2. Configure environment variables

Create `packages/backend/.env`:

```env
MONGO_USER=<atlas_username>
MONGO_PWD=<atlas_password>
MONGO_CLUSTER=<cluster_hostname>
DB_NAME=<database_name>
JWT_SECRET=<your_secret_key>
USERS_COLLECTION_NAME=users
CREDS_COLLECTION_NAME=user_credentials
CATEGORIES_COLLECTION_NAME=categories
CHARGES_COLLECTION_NAME=charges
STATIC_DIR=public
PORT=3000
```

### 3. Run in development

Start the backend and frontend separately:

```bash
# Terminal 1 — Backend (Express on port 3000)
cd packages/backend
npm run dev

# Terminal 2 — Frontend (Vite dev server with HMR)
cd packages/frontend
npm run dev
```

### 4. Build for production

```bash
# Build the frontend
cd packages/frontend
npm run build

# Build and start the backend (serves frontend dist as static files)
cd packages/backend
npm run start
```

## Testing

```bash
cd packages/backend
npm run test
```

Runs 41 integration tests covering auth middleware, credential routes, charge CRUD, category CRUD (with cascade deletion), and the summary aggregation pipeline. All tests use mocked MongoDB — no database connection required.

## Features

- **User Authentication** — Register and login with bcrypt-hashed passwords and JWT tokens
- **Budget Categories** — Create, edit, and delete spending categories with allotment limits
- **Expense Tracking** — Log individual charges under categories with descriptions, amounts, and dates
- **Dashboard Summary** — View total spending vs. budget with circular progress visualizations
- **Cascade Deletion** — Deleting a category automatically removes all its charges
- **Dark Mode** — Toggle between light and dark themes (persisted in localStorage)

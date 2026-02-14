# BudgetTracker Frontend

React single-page application for the BudgetTracker. Provides user authentication, budget category management, expense tracking with circular progress visualizations, and dark mode support.

## Tech Stack

- **Framework:** React 19
- **Routing:** React Router DOM 7
- **Build Tool:** Vite + SWC
- **Language:** TypeScript

## Project Structure

```
src/
├── main.tsx                 # Entry point — mounts App inside BrowserRouter
├── App.tsx                  # Root component — auth state, routing, data fetching
├── api/
│   ├── auth.ts              # JWT header builder
│   ├── credentials.ts       # Login, register, getUserId API calls
│   ├── categories.ts        # Category CRUD API calls
│   └── charges.ts           # Charge CRUD API calls
├── hooks/
│   ├── useSummary.ts        # Fetches user financial summary with refetch
│   ├── useProgress.ts       # Drives CSS circular progress via ref
│   ├── useLoadingError.ts   # Consumes global loading/error context
│   ├── useFormatDate.ts     # Normalizes dates to YYYY-MM-DD
│   └── useSlugtify.ts       # Converts strings to URL-safe slugs
├── context/
│   └── loadingErrorContext.tsx  # Global loading/error state provider
├── components/
│   ├── Layout.tsx            # Header + Outlet + Footer wrapper
│   ├── Header.tsx            # Top nav with logout and dark mode toggle
│   ├── Footer.tsx            # Bottom nav with icon links
│   ├── CircularProgress.tsx  # CSS-driven progress ring
│   └── DarkMode.tsx          # Theme toggle (localStorage persisted)
├── pages/
│   ├── LoginFormPage.tsx     # Login form
│   ├── RegisterFormPage.tsx  # Registration form
│   ├── UserPage.tsx          # Dashboard — total spending + category list
│   ├── CategoryPage.tsx      # Category detail — charges list
│   ├── CategoryFormPage.tsx  # Create/edit/delete category
│   └── ChargeFormPage.tsx    # Create/edit/delete charge
├── types/                    # TypeScript interfaces matching backend models
└── css/                      # Stylesheets
```

## Route Structure

| Path | Component | Description |
|------|-----------|-------------|
| `/` (unauth) | `LoginFormPage` | Login screen |
| `/register` | `RegisterFormPage` | Registration screen |
| `/` (auth) | Redirect | Redirects to `/:username/:userId` |
| `/:username/:userId` | `UserPage` | Budget dashboard |
| `/:username/:userId/:category/:catId` | `CategoryPage` | Category detail |
| `/:username/:userId/:catId` | `CategoryFormPage` | Edit category |
| `/:username/:userId/category/new` | `CategoryFormPage` | New category |
| `/:username/:userId/:category/:catId/:chId` | `ChargeFormPage` | Edit charge |
| `/:username/:userId/:category/:catId/new` | `ChargeFormPage` | New charge |

## Scripts

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript check + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

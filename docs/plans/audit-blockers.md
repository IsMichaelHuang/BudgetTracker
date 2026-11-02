# Audit Blockers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development to implement this plan task by
> task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix audit blockers B1-B6 from
`docs/plans/code-audit-findings.md`, test-first, on `fix/audit-blockers`.

**Tech Stack:** Express 4, TypeScript, Vitest, Supertest, React 19,
react-router 7, Testing Library, jsdom.

**Spec:** `docs/plans/audit-blockers-decisions.md`.

## Global Constraints

- Base: `fix/prod-blockers`. Work in a worktree. The main checkout stays on
  `feature/sop-phase-b`.
- TDD: run each failing test and confirm the failure reason before coding.
- Never weaken or delete an existing test.
- New files: max 400 lines, max 80 characters per line.
- Modified files: every line you add or change is max 80 characters. Older
  wide lines stay, because they belong to Phase E item 19 (audit M12).
- `package-lock.json` is exempt from file limits.
- Prefix git commands with `PATH=/opt/homebrew/bin:$PATH`.
- Commit messages end with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never commit `graphify-out/`, `CODEBASE_REPORT.md`, or
  `docs/plans/code-audit*`.
- Never set `TEST_DATABASE_URL` to anything but a throwaway test database.
- No push, merge, or PR until Michael approves.
- Subagents use the `sonnet` model.

## Non-goals

- Failed-save messages (M1), footer icon paths (m10), reformatting old wide
  lines (M12), and the root README outside `STATIC_DIR` and its testing
  section (M8).
- A uniqueness rule on category titles, or any schema change.
- Restricting usernames at registration.
- A full frontend test suite. Only tests these fixes need.

## Acceptance criteria

- **AC1 (B1):** With `STATIC_DIR` unset, `GET /` and a built JS asset both
  return 200. A relative or absolute override still works.
- **AC2 (B2):** `GET /alice/<uuid>`, `GET /net-worth`, and
  `GET /alice/<uuid>/food/<uuid>` return `index.html`. A missing asset returns
  404. `/api` paths without a token return 401.
- **AC3 (B3):** A category titled `Rent/Utilities`, `Kids #1`, `Q&A?`,
  `李雷`, `..`, or `100%` opens its own page from the dashboard, showing its
  full title, and its add-charge link opens the charge form. Old URLs with
  a stale title segment still open the right category.
- **AC4 (B4):** After login, a user named `李雷`, `---`, or `Net Worth`
  lands on the dashboard.
- **AC5 (B5):** With two categories titled `Food`, adding or editing a charge
  saves the category the user chose, by ID.
- **AC6 (B6):** A `TEST_DATABASE_URL` that isn't a plain Postgres URL naming a
  `_test` database stops setup before any connection. An empty value uses
  embedded Postgres in both setup and the app pool.
- **AC7:** Full unit and integration suites, types, lint, frontend build, and a
  clean `npm ci` all pass, and existing tests are unchanged.
- **AC8:** Docs describe the new behavior in the same change.

## Design

- **Static serving:** `config.ts` resolves one absolute directory. `app.ts`
  serves assets from it and falls back to its `index.html`. No API changes,
  except that two stray `index.html` responses become 404 (see Risks).
- **Test database:** one function decides the URL. Vitest's config and
  `globalSetup.ts` both call it, so they can't disagree. It lives in its own
  file, because `globalSetup.ts` imports `embedded-postgres`.
- **Frontend:** `:category` in routes stays, so old URLs keep matching, but no
  code reads it. Category links and forms use `_id`. No API or data changes.

## Review Focus

- A stale `STATIC_DIR=public` means `index.html` is missing: the response is a
  500 JSON error with no filesystem path. Pinned in Task 2.
- Path probes such as `/.env` and `/..%2f..%2fpackage.json` never return file
  contents. Pinned in Task 2.
- `/API/nope` in another letter case still requires a token. Pinned in Task 2.
- The guard's error never prints the URL or password, even for unparseable
  input. Pinned in Task 1.
- Old bookmarks, and titles that slugify to `new` or `category`, reach the
  right category page. Pinned in Task 4.

---

### Task 0: Set up the worktree (main agent)

- [ ] **Step 1:** Run
  `git worktree add -b fix/audit-blockers "$WT" fix/prod-blockers`, with `$WT`
  set to `blockers-wt` in the session scratchpad.
- [ ] **Step 2:** Run `npm ci` in `$WT`. Run `npm test`. Expected: 263 pass.
- [ ] **Step 3:** Save the Decisions and Acceptance criteria as
  `docs/plans/audit-blockers-decisions.md`. Save this plan, minus its Decisions
  section, as `docs/plans/audit-blockers.md`. Commit both to the branch.

### Task 1: Guard the test database (B6)

**Files:**
- Create: `packages/backend/src/__integration__/testDatabase.ts`
- Modify: `packages/backend/src/__integration__/globalSetup.ts:23`
- Modify: `packages/backend/vitest.integration.config.ts:27`
- Modify: `packages/backend/README.md` (`TEST_DATABASE_URL`, "Two suites")
- Test: `packages/backend/src/__tests__/testDatabase.test.ts`,
  `packages/backend/src/__tests__/testDatabase.setup.test.ts`, each importing
  from `../__integration__/`

**Interfaces:**
- Produces:
  `resolveTestDatabaseUrl(env: NodeJS.ProcessEnv): string | undefined`.
  It returns `undefined` when unset or empty, returns the URL when valid, and
  throws otherwise.

- [ ] **Step 1: Write failing tests.** In `testDatabase.test.ts`:

  ```ts
  const u = (v?: string) => resolveTestDatabaseUrl({ TEST_DATABASE_URL: v });
  // undefined for undefined and ""
  // returns the URL for:
  //   postgres://u:p@localhost:5432/budget_test
  //   postgresql://u:p@db.ci:5432/x_test?sslmode=require
  // throws for:
  //   postgres://u:p@localhost:5432/budget_prod
  //   postgres://u:p@localhost:5432/budget_test_backup
  //   postgres://u:p@localhost:5432/test
  //   postgres://u:p@localhost:5432
  //   socket:/tmp/x_test?db=prod
  //   postgres://u:p@h/x_test?database=prod
  //   postgres://u:p@h/x_test?host=prod.example
  // thrown messages for postgres://u:s3cret@h/prod and for
  //   "not a url s3cret" have no "s3cret", and no property
  //   of the thrown error contains it
  ```

  In `testDatabase.setup.test.ts`, mock `pg` (`Client`: `connect`, `query`,
  `end`) and the `embedded-postgres` default export (`initialise`, `start`,
  `createDatabase`, `stop`). Use `function` or `class` mocks, since they're
  called with `new`. Call the returned teardown, to remove the temp directory.

  ```ts
  // TEST_DATABASE_URL=postgres://u:p@h/prod: setup() rejects,
  //   and neither Client nor EmbeddedPostgres is constructed
  // TEST_DATABASE_URL="": EmbeddedPostgres is constructed, and
  //   Client receives the embedded URL
  ```
- [ ] **Step 2:** Run `npx vitest run src/__tests__/testDatabase` in
  `packages/backend`. Expected: both files FAIL. The first has a missing
  module. The setup test's prod case fails because `Client` was constructed.
- [ ] **Step 3:** Implement with `new URL()` in a `try`/`catch`, and throw one
  fixed message that never includes the input. Require protocol `postgres:` or
  `postgresql:`, no query key other than `sslmode`, and a `decodeURI`d pathname
  ending in `_test`. Use it in `globalSetup.ts:23` and in the config as
  `resolveTestDatabaseUrl(process.env) ?? EMBEDDED_URL`.
- [ ] **Step 4:** Update the README: the name must end in `_test`, or setup
  refuses to run. Keep its suite description true.
- [ ] **Step 5:** Run these. Expected: unit tests pass; the first command exits
  non-zero with the guard's message; the second passes 10 of 10.
  `TEST_DATABASE_URL=postgres://x:y@localhost:1/prod npm run test:integration`
  `TEST_DATABASE_URL= npm run test:integration`
- [ ] **Step 6:** Commit: `fix: refuse integration runs on non-test databases`.

### Task 2: Serve the production frontend (B1, B2)

**Files:**
- Modify: `packages/backend/src/config.ts`
- Modify: `packages/backend/src/app.ts:6,12,32,35,52-56`
- Modify: `packages/backend/src/shared/staticRoutes.share.ts` (drop unused
  `START`)
- Modify: `README.md:61`, `packages/backend/README.md:153`
- Test: `packages/backend/src/__tests__/static.routes.test.ts`

**Interfaces:**
- Produces: `readStaticDir(env: NodeJS.ProcessEnv): string`, always absolute.
  It uses `STATIC_DIR` through `path.resolve` when non-empty, otherwise
  `path.resolve(__dirname, "../../frontend/dist")`.

- [ ] **Step 1: Write failing tests.** Create a temp directory with
  `index.html` and `assets/app.js`, set `STATIC_DIR` to it, then
  `vi.resetModules()` and import `../app` dynamically.

  ```ts
  // GET / -> 200, html
  // GET /assets/app.js -> 200, javascript
  // GET /alice/<uuid>, /alice/<uuid>/, /net-worth,
  //   /alice/<uuid>/food/<uuid> -> 200, html
  // GET /assets/missing.js -> 404
  // GET /api, /api/nope, /API/nope with no token -> 401
  // GET /.env and /..%2f..%2fpackage.json -> body has no file contents
  // readStaticDir({}) is absolute and ends in frontend/dist
  // readStaticDir({ STATIC_DIR: "" }) equals readStaticDir({})
  // readStaticDir({ STATIC_DIR: "../x" }) === path.resolve("../x")
  // STATIC_DIR with no index.html: GET /x -> 500 JSON,
  //   and the body doesn't contain that directory's path
  ```
- [ ] **Step 2:** Run the file. Expected: deep links and `readStaticDir` fail.
- [ ] **Step 3:** Implement. Use `const STATIC_DIR = readStaticDir(process.env)`
  for `express.static`. Replace lines 52-56 with:

  ```ts
  app.get("*", (req, res, next) => {
      if (/^\/api(\/|$)/i.test(req.path) || path.extname(req.path)) {
          next();
          return;
      }
      res.sendFile("index.html", { root: STATIC_DIR });
  });
  ```
- [ ] **Step 4:** Update both READMEs: remove `STATIC_DIR=public`. Say it's
  optional, defaults to `packages/frontend/dist`, and must only point at build
  output, because every file in it is public. Update the `app.ts` header
  comment.
- [ ] **Step 5:** Run `npm test`. Expected: all pass, with no old test changed.
- [ ] **Step 6:** Commit: `fix: serve the frontend build and SPA deep links`.

### Task 3: Frontend tests and username slugs (B4)

**Files:**
- Modify: `packages/frontend/package.json`, `package-lock.json`, root
  `package.json`
- Create: `packages/frontend/vitest.config.ts`
- Modify: `packages/frontend/src/hooks/useSlugtify.ts`
- Modify: `packages/frontend/src/App.tsx:49,76`
- Modify: `packages/frontend/README.md` (testing section, line 28),
  `README.md:13,91-98` (testing only)
- Create: `packages/frontend/src/__tests__/helpers.ts`
- Test: `packages/frontend/src/__tests__/urlSlug.test.ts`,
  `packages/frontend/src/__tests__/App.login.test.tsx`

**Interfaces:**
- Produces, as named exports of `hooks/useSlugtify.ts`:
  `slugify(name: string): string`, `userSlug(name: string): string`,
  `categorySlug(title: string): string`. The default `useSlugtify` export goes
  away, because a hook name called inside `.map` breaks the hooks lint rule.
  Update the file's header comment.
- Produces: `summaryWith(categories, charges, name?): SummaryType` in
  `src/__tests__/helpers.ts`, used by this task and Task 4.

Test files import `describe`, `it`, `expect`, and `vi` from `vitest`, and use
`import type` for types, because `tsc -b` checks `src/__tests__`.

- [ ] **Step 1: Set up tools.** Run this, then confirm one `vitest` version is
  installed across the workspace:

  ```bash
  npm install -D -w packages/frontend vitest@^4.0.18 jsdom \
    @testing-library/react @testing-library/dom
  ```

  Add `"test": "vitest run"`. Create `vitest.config.ts` with the React plugin,
  `environment: "jsdom"`, `globals: true`, and
  `include: ["src/__tests__/**/*.test.{ts,tsx}"]`. Set the root `test` script
  to `npm run test -w packages/backend && npm run test -w packages/frontend`.
- [ ] **Step 2: Write failing tests.**

  ```ts
  // userSlug: "Alice Smith" -> "alice-smith"
  // userSlug: "李雷", "---", "Net Worth", "net-worth" -> "user"
  // categorySlug: "Rent/Utilities" -> "rent-utilities"
  // categorySlug: "Kids #1" -> "kids-1"
  // categorySlug: "李雷", ".." -> "category"
  ```

  `App.login.test.tsx`: mock `../hooks/useSummary`, `../api/credentials`, and
  `../api/auth`, set a token in `localStorage`, and render `App` in
  `<MemoryRouter initialEntries={["/"]}>`, from `react-router-dom`. For each
  of `Alice`, `李雷`, `---`, and `Net Worth`:
  `await screen.findByText("Total Spent")`.
- [ ] **Step 3:** Run `npm test -w packages/frontend`. Expected: the helper
  tests fail on missing exports. `李雷` and `---` find no route. `Net Worth`
  lands on the net-worth form, the wrong page. `Alice` passes.
- [ ] **Step 4:** Implement the three functions. In `App.tsx`, use
  `userSlug(summary?.user.name ?? "")`.
- [ ] **Step 5:** Run frontend tests, `npm run build -w packages/frontend`
  (which runs `tsc -b`), and `npm run lint -w packages/frontend`. Expected:
  pass, 0 lint errors, no test code in `dist/assets`. Then confirm `npm ci`
  succeeds.
- [ ] **Step 6:** Update both READMEs: root `npm test` runs both packages,
  `npm run test:integration` runs real Postgres, no test counts, and
  `README.md:13` and `91-98` no longer mention mocked MongoDB. Update
  `packages/frontend/README.md:28`.
- [ ] **Step 7:** Commit: `fix: keep every username routable after login`.

### Task 4: Find categories by ID (B3, B5)

**Files:**
- Modify: `packages/frontend/src/pages/UserPage.tsx:45`
- Modify: `packages/frontend/src/pages/CategoryPage.tsx:29,41,43,54,62,73`
- Modify: `packages/frontend/src/pages/ChargeFormPage.tsx:34,42,48,54-58,74,123`
- Modify: `packages/frontend/src/App.tsx:17,20,21` (route comment),
  `packages/frontend/README.md` (route table)
- Test: `packages/frontend/src/__tests__/App.category.test.tsx`,
  `packages/frontend/src/__tests__/ChargeFormPage.test.tsx`

**Interfaces:**
- Consumes: `categorySlug` and `summaryWith` from Task 3.

- [ ] **Step 1: Write failing tests.** `App.category.test.tsx`, for each title
  in `Rent/Utilities`, `Kids #1`, `Q&A?`, `李雷`, `..`, `100%`, `new`,
  `category`:

  ```tsx
  fireEvent.click(await screen.findByText(title));
  expect(await screen.findByRole("heading", { name: title })).toBeTruthy();
  fireEvent.click(screen.getByText("+ Add New Charge"));
  expect((await screen.findByRole("combobox") as HTMLSelectElement).value)
      .toBe(catId);
  ```

  Also: `/al/<uid>/Rent/<catId>`, for a category titled `Rent2`, shows the
  heading `Rent2`.

  `ChargeFormPage.test.tsx`: mock `../api/charges` and `window.history.back`,
  with categories `A` and `B` both titled `Food`. Every submit fills amount and
  date, because `!amount` throws.

  ```ts
  // at /al/u/Food/B/new, submit -> addCharge has categoryId "B"
  // at /al/u/Food/B/c1 (c1 in B), submit -> updateCharge has "B"
  // at /al/u/Food/A/c1 (c1 in B), select starts on "B"
  // change select to "A", submit -> updateCharge has categoryId "A"
  // at /al/u/Food/unknown/new, select value is "" (no submit: the
  //   existing throw is an unhandled rejection, which fails vitest)
  ```
- [ ] **Step 2:** Run them. Expected: `Rent/Utilities`, `Kids #1`, `Q&A?`, and
  `100%` fail on the wrong page. `李雷`, `..`, `new`, and `category` fail only
  at the combobox value. The stale-title test fails on its heading. `B`
  submissions send `A`.
- [ ] **Step 3:** Implement. `UserPage` and `CategoryPage` links use
  `categorySlug(title)`. `CategoryPage` reads `category.title` for its heading.
  `ChargeFormPage`: state starts as `charge?.categoryId ?? params.catId` when
  that ID is in `categoryList`, otherwise `""`. Options use `value={cat._id}`,
  lookup uses `cat._id === category`, and `categoryTitle` and its effect are
  removed.
- [ ] **Step 4:** Update the route comments and README: `:category` is a slug,
  and only `:catId` is read.
- [ ] **Step 5:** Run `npm test`, frontend build, and lint. Expected: pass.
- [ ] **Step 6:** Commit: `fix: identify categories by ID, not title`.

### Task 5: Verify and answer the four questions (main agent)

- [ ] **Step 1:** Run all gates in `$WT`: `npm ci`, `npm test`,
  `env -u TEST_DATABASE_URL npm run test:integration`, `tsc` for both packages,
  `npm run lint -w packages/frontend`, and `npm run build -w packages/frontend`.
- [ ] **Step 2:** Run the audit's `limits.sh` on files this branch adds, and
  check that changed lines in modified files are within limits. `awk` counts
  bytes, so a flagged line with CJK text may be a false positive: count its
  characters.
- [ ] **Step 3:** Check B1 against a real build: compile the backend, confirm
  `dist/config.js` resolves `readStaticDir({})` to `packages/frontend/dist`,
  and fetch a real built asset with a temporary probe that isn't committed.
- [ ] **Step 4:** Trace each AC to a passing test. Confirm no existing test
  changed: `git diff fix/prod-blockers --stat --diff-filter=MD -- '*.test.*'`.
- [ ] **Step 5:** Write the four answers in this plan's final section. Any
  action goes back through Tasks 1-4.
- [ ] **Step 6:** Report in i-have-adhd format, then stop for approval.
  `superpowers:finishing-a-development-branch` runs only after approval.

## Test plan

- Unit: AC1, AC2, AC6 in Tasks 1-2. Component: AC3, AC4, AC5 in Tasks 3-4.
- Integration: the existing 10 tests prove the harness still runs (AC6, AC7).
- End to end: Task 5 Step 3 covers AC1 on a real build. No browser test: AC3
  and AC4 run the real `App` and routes in jsdom. The report states this limit.

## Risks

- **Auth surface:** the SPA fallback widens what GET answers. It returns only
  `index.html`, and tests pin `/api` and path probes.
- **Stale config:** a deployment with `STATIC_DIR=public` stays broken until
  it's removed. The READMEs say so. Michael's `.env` isn't affected.
- **Unmerged base:** this stacks on `fix/prod-blockers`.
- **Dependencies:** the lockfile changes. Task 3 checks `npm ci`.
- **Behavior change:** `GET /api/user/` with a token and `GET /api/public/`
  with none used to return `index.html`. Both become 404. Nothing calls them.
- **Guard scope:** it checks the name only, per Decision 6, so a `_test`
  database on a production host would still pass.

## Rollback

Nothing touches the schema or stored data. Drop the branch before merge, or
revert its commits after.

## Review log

Seven Sonnet reviewers plus one second pass. No blockers.

- **Fixed, major:** the `socket:` guard bypass; tests failing `tsc -b`;
  ChargeFormPage tests failing for the wrong reason; false root README text;
  an unhandled rejection in the unknown-ID test; over-long plan lines.
- **Fixed, minor:** leak test, stale-title test, unknown-ID select state, setup
  test file and mocks, failure reasons, Design section, Risks, README notes.
- **Rejected, major:** updating `.planning/` docs on `STATIC_DIR`. They're
  dated snapshots that Phase E item 18 removes.
- **Rejected, minor:** `JWT_SECRET` in the static test (the config sets it);
  unit-testing the default directory (Task 5 Step 3 checks a real build).
- **Reconciled:** reviewers disagreed on whether `?database=` overrides the
  path. Rejecting all query keys but `sslmode` makes it moot.

## Four questions

Answered in Task 5.

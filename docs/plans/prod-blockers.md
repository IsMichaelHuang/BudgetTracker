# Plan: production blockers from the postgres-sql sweep

Parent: the production sweep of `features/postgres-sql` (run on the tip
of `feature/sop-phase-b`), blocker items 1-3. Branch:
`fix/prod-blockers`, based on `feature/sop-phase-b`.

## Goal

The frontend works against real Postgres the way it did against Mongo,
a clean checkout installs with `npm ci`, and bad login input gets a 4xx
JSON answer instead of a 500 with a stack trace.

## Non-goals

Rate limiting, helmet, DATE columns, static-dir fix, deploy/migration
runner, summary write-on-read, case-insensitive usernames (sweep items
4-7 and minors; Phase D/E). Frontend changes (none needed once numbers
are numbers). The full Phase C integration suite: this adds the harness
and the tests these fixes need, plus the Phase B "four questions"
priorities, not every route.

## Acceptance criteria

1. Given rows with NUMERIC columns, every API response carries
   `amount`, `allotment`, `value`, `totalAmount`, `totalAllotment` as
   JSON numbers, not strings (summary, net-worth list).
2. Given a category or charge read from the API, when the frontend
   sends it back unchanged on PATCH (with `_id`, `userId`), the API
   returns 201 (today: 400 "expected number, received string").
3. Given two charges of 0.1 and 0.2, the category and user totals are
   exactly 0.3 (the sum is done in SQL NUMERIC, so no float drift).
4. `npm ci` at the repo root succeeds on a clean clone.
5. `POST /api/public/login` with a missing, empty, non-string, or extra
   field returns 400 JSON and runs no query.
6. A malformed JSON body on any route returns 400 JSON; an unexpected
   error returns 500 `{ "error": "Internal server error" }` with no
   stack trace, and the error is logged server-side.
7. `npm test` stays mock-only and green; `npm run test:integration`
   runs against a real Postgres with no Docker and no manual setup.

## Design

### 1. NUMERIC as numbers

`pg` returns NUMERIC (OID 1700) as strings to avoid precision loss.
Every NUMERIC column here is NUMERIC(12,2), max 9,999,999,999.99, which
is well inside the 2^53 exact-integer range, so `Number()` keeps every
cent. Register `types.setTypeParser(types.builtins.NUMERIC, ...)` in
`postgres.database.ts` before the pool is created. `null` stays `null`
(pg does not call parsers for nulls). SUMs stay in SQL, so criterion 3
holds; JS only sees the final 2-decimal value.

Alternative rejected: map per field in `rowToDoc`. Easy to miss a
column; the global parser covers every query, including SUM.

### 2. Lockfile

`npm install --package-lock-only` at the root regenerates
`package-lock.json` without touching `node_modules`. Verify with
`npm ci` in a fresh clone.

### 3. Login validation and error handling

- Mount `validateBody(loginSchema)` on `/login` (schema exists, unused).
  The frontend sends exactly `{ username, password }`, so `.strict()`
  is safe. Add `.max(255)` to username and `.max(72)` to password
  (bcrypt's limit) so huge strings never reach bcrypt.
- New `middleware/error.middleware.ts`, mounted last:
  body-parser `entity.parse.failed` -> 400, `entity.too.large` -> 413,
  anything else -> log with `console.error` and 500
  `{ error: "Internal server error" }`. Keep `mapDbErrors` before it.

### 4. Integration harness

- `vitest.integration.config.ts` includes only
  `src/__integration__/**/*.test.ts`; the default config excludes that
  folder. `fileParallelism: false` (one shared DB).
- `globalSetup` starts `embedded-postgres` (devDependency, pinned
  17.x; ships Postgres binaries for macOS and Linux, so no Docker) on
  port 54330 in a temp dir, or uses `TEST_DATABASE_URL` if set. It
  applies `db/migrations/001_create_schema.sql`, and stops the server
  after.
- Each test file truncates all tables in `beforeEach`.

## Tasks (TDD: failing test first in each)

0. Harness: configs, globalSetup, `test:integration` script, one
   "migration applied" test. Unit suite unaffected.
1. Integration test: NUMERIC fields are numbers in summary and
   net-worth responses (fails), then add the type parser. Unit test:
   the parser returns 12.34 for "12.34".
2. Integration test: PATCH round-trip of a category and a charge as
   read from the API returns 201 (fails before task 1, passes after).
3. Integration test: 0.1 + 0.2 charges give totals of exactly 0.3.
4. Integration tests for Phase B's open questions: charge
   `INSERT ... SELECT` casts work; another user's category -> 404 with
   no row; registration rolls back and 409s on the real constraint
   name; cross-user read/update/delete -> 404 with rows unchanged.
5. Unit tests: login 400 cases, query not called (fail), then wire the
   schema.
6. Unit tests: malformed JSON -> 400; thrown error -> 500 JSON without
   a stack (fail), then the error middleware.
7. Regenerate the lockfile; verify `npm ci` in a fresh clone.
8. Docs: backend README (number types, login validation, error
   responses, integration tests); fix "MongoDB is fully mocked".

## Test plan

Unit (mocked pg): `npm test`. Integration (real Postgres 17):
`npm run test:integration`. Gates: backend `tsc --noEmit`, frontend
`npm run build` and `eslint`.

## Risks

- Anything that relied on string amounts breaks. Checked: the frontend
  types already declare `number`; no backend code does string math.
- `embedded-postgres` downloads ~30 MB of binaries per platform on
  install (dev only; not in the production image if installed with
  `--omit=dev`).
- Login now rejects extra keys. Only the frontend calls it.

## Rollback

Revert the branch. No schema migration.

---

## Review log (self-review; revisions override the above)

R1. Build leak (major). `tsconfig.json` excludes `src/__tests__` but
not `src/__integration__`, so `npm run build` would compile the
integration tests (and their dev-only imports) into `dist/`. Exclude
it.

R2. Env reaches workers (major). `postgres.database.ts` reads env at
import. Put `DATABASE_URL` in the integration config's `env` (from
`TEST_DATABASE_URL` or the embedded default) rather than setting it
inside globalSetup, so every worker sees it before import.

R3. Root script (minor). Add `test:integration` to the root
`package.json` as well, matching `test`.

R4. Parser scope (minor). The parser is process-global. That is the
intent, but note it in the code so nobody "fixes" it per query.

R5. Error middleware ordering (minor). It must come after the SPA
catch-all and `mapDbErrors`; a test asserts a thrown controller error
yields JSON 500 with no `stack` in the body.
